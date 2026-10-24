import type { AuditService, SubjectType } from '@ministryofjustice/hmpps-audit-client'
import type { Request, RequestHandler } from 'express'

import logger from '../../logger'

/**
 * Requests that are not page views: the prisoner photo and the redirect back to the start of a journey.
 * Health checks and static resources are mounted earlier in app.ts so never reach here.
 */
const notPageViews = [/^\/prisoner\/[^/]+\/image(?:\?.*)?$/, /^\/back-to-start(?:\?.*)?$/]

/**
 * Pages that are rendered but are not a successful view. A user without the role for a journey is shown the
 * not found page with a 200 status (see authorisationMiddleware), so the status code alone does not show it.
 */
const notSuccessfulViews = ['pages/notFound.njk', 'pages/error']

const prisonerNumberPattern = /^[A-Z][0-9]{4}[A-Z]{2}$/i

/** HMPPS Audit rejects subject ids longer than this */
const maxSubjectIdLength = 80

type Subject = { subjectType: SubjectType; subjectId?: string }

type RenderCallback = (err: Error, html: string) => void
type ResRender = (view: string, options?: object | RenderCallback, callback?: RenderCallback) => void

/**
 * Audits page views to HMPPS Audit.
 *
 * Emits PAGE_VIEW_ACCESS_ATTEMPT once the response closes – covering redirects, errors and
 * requests refused by the authorisation middleware – and PAGE_VIEW when a page
 * renders successfully.
 *
 * Mount after authentication but before authorisation, so that refused requests are still
 * recorded as attempts.
 */
export default function auditPageView(auditService: AuditService): RequestHandler {
  return (req, res, next) => {
    const who = res.locals.user?.username
    if (!who || notPageViews.some(pattern => pattern.test(req.originalUrl))) {
      next()
      return
    }

    res.locals.auditEvent = {
      who,
      correlationId: req.id,
      // the query string is left out because searches carry prisoners' names; the search term is the subject instead
      details: { pageUrl: req.originalUrl.split('?')[0] },
      ...subjectOfRequest(req),
    }

    res.prependOnceListener('close', () => {
      logPageView(auditService, res.locals.auditEvent, true)
    })

    const resRender = res.render.bind(res) as ResRender
    res.render = ((view: string, options?: object | RenderCallback, callback?: RenderCallback) => {
      if (typeof options === 'function' || callback) {
        // the caller handles the rendered html itself, so this is not a page being sent to the user
        resRender(view, options, callback)
        return
      }
      resRender(view, options, (err: Error, html: string) => {
        if (err) {
          next(err)
          return
        }
        // send the page first: auditing must never delay or break rendering
        res.send(html)
        if (res.statusCode < 400 && !notSuccessfulViews.includes(view)) {
          logPageView(auditService, res.locals.auditEvent)
        }
      })
    }) as typeof res.render

    next()
  }
}

function subjectOfRequest(req: Request): Subject {
  const { prisonerNumber, searchTerm } = req.query ?? {}
  if (typeof prisonerNumber === 'string' && prisonerNumberPattern.test(prisonerNumber.trim())) {
    return { subjectType: 'PRISONER_ID', subjectId: prisonerNumber.trim().toUpperCase() }
  }
  if (typeof searchTerm === 'string' && searchTerm.trim() !== '') {
    return { subjectType: 'SEARCH_TERM', subjectId: searchTerm.trim().substring(0, maxSubjectIdLength) }
  }
  return { subjectType: 'NOT_APPLICABLE' }
}

function logPageView(auditService: AuditService, auditEvent: Express.Locals['auditEvent'], isAttempt = false): void {
  if (!auditEvent) return
  // auditing must not be able to break page rendering, so never throw
  auditService
    .logAuditEvent(
      { ...auditEvent, what: isAttempt ? 'PAGE_VIEW_ACCESS_ATTEMPT' : 'PAGE_VIEW' },
      { throwOnError: false, logOnError: true },
    )
    .catch(error => {
      logger.error(error, 'Failed to audit page view')
    })
}
