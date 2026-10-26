import type { Express, Request, Response } from 'express'
import request from 'supertest'

import { AuditService } from '@ministryofjustice/hmpps-audit-client'

import auditPageView from './auditPageView'
import { appWithAllRoutes, user } from '../routes/testutils/appSetup'
import { PrisonUser } from '../interfaces/hmppsUser'

jest.mock('@ministryofjustice/hmpps-audit-client')

let auditService: jest.Mocked<AuditService>

function appWithAuditing({
  roles = [],
  userSupplier = () => user,
}: { roles?: string[]; userSupplier?: () => PrisonUser } = {}): Express {
  return appWithAllRoutes({ services: { auditService }, roles, userSupplier })
}

/** audit events logged, in the order the audit service saw them */
function loggedEvents() {
  return auditService.logAuditEvent.mock.calls.map(([event]) => ({
    subject: { subjectType: event.subjectType, subjectId: event.subjectId },
    what: event.what,
  }))
}

/** the access attempt is logged for every audited request, whether or not the page rendered */
function attemptSubject() {
  return loggedEvents().find(event => event.what === 'PAGE_VIEW_ACCESS_ATTEMPT')?.subject
}

const noSubject = { subjectType: 'NOT_APPLICABLE', subjectId: undefined }

beforeEach(() => {
  auditService = new AuditService(null as never) as jest.Mocked<AuditService>
  auditService.logAuditEvent.mockResolvedValue(undefined)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('auditPageView', () => {
  it('logs a page view and an access attempt when a page renders', async () => {
    await request(appWithAuditing()).get('/help').expect(200)

    expect(loggedEvents()).toEqual([
      { subject: noSubject, what: 'PAGE_VIEW' },
      { subject: noSubject, what: 'PAGE_VIEW_ACCESS_ATTEMPT' },
    ])
  })

  it('passes the username, correlation id and page path to the audit service without throwing on failure', async () => {
    await request(appWithAuditing({ roles: ['SEARCH_RESTRICTED_PATIENT'] }))
      .get('/view-restricted-patients/search-for-patient')
      .expect(200)

    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        who: user.username,
        correlationId: '4d0fd4da-ecc1-454d-8308-cdee6b8b91f7',
        details: { pageUrl: '/view-restricted-patients/search-for-patient' },
      }),
      { throwOnError: false, logOnError: true },
    )
  })

  it('takes the prisoner from the query string', async () => {
    await request(appWithAuditing({ roles: ['TRANSFER_RESTRICTED_PATIENT'] })).get(
      '/move-to-hospital/select-hospital?prisonerNumber=a1234aa',
    )

    expect(attemptSubject()).toEqual({ subjectType: 'PRISONER_ID', subjectId: 'A1234AA' })
  })

  it('records the search term as the subject and leaves it out of the page url', async () => {
    await request(appWithAuditing({ roles: ['SEARCH_RESTRICTED_PATIENT'] })).get(
      '/view-restricted-patients?searchTerm=Smith',
    )

    expect(attemptSubject()).toEqual({ subjectType: 'SEARCH_TERM', subjectId: 'Smith' })
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ details: { pageUrl: '/view-restricted-patients' } }),
      expect.anything(),
    )
  })

  it('truncates long search terms', async () => {
    await request(appWithAuditing({ roles: ['SEARCH_RESTRICTED_PATIENT'] })).get(
      `/view-restricted-patients?searchTerm=${'x'.repeat(100)}`,
    )

    expect(attemptSubject()?.subjectId).toHaveLength(80)
  })

  it.each([
    ['the help page', '/help'],
    ['an empty search', '/view-restricted-patients?searchTerm='],
    ['a prisoner number that is not one', '/move-to-hospital/select-hospital?prisonerNumber=Smith'],
  ])('has no subject for %s', async (_name, url) => {
    await request(appWithAuditing({ roles: ['SEARCH_RESTRICTED_PATIENT', 'TRANSFER_RESTRICTED_PATIENT'] })).get(url)

    expect(attemptSubject()).toEqual(noSubject)
  })

  it('logs only an attempt when the user does not have the role for the journey', async () => {
    await request(appWithAuditing())
      .get('/view-restricted-patients/search-for-patient')
      .expect(200)
      .expect(res => expect(res.text).toContain('Page not found'))

    expect(loggedEvents()).toEqual([{ subject: noSubject, what: 'PAGE_VIEW_ACCESS_ATTEMPT' }])
  })

  it('logs only an attempt when the page is not found', async () => {
    await request(appWithAuditing()).get('/missing').expect(404)

    expect(loggedEvents()).toEqual([{ subject: noSubject, what: 'PAGE_VIEW_ACCESS_ATTEMPT' }])
  })

  it('passes render errors to the error handler rather than swallowing them', async () => {
    const app = appWithAuditing()
    // fail the help page template only; the error page then renders as normal
    jest
      .spyOn(app, 'render')
      .mockImplementationOnce(((_view: string, _options: object, callback: (err: Error) => void) =>
        callback(new Error('render failed'))) as typeof app.render)

    await request(app).get('/help').expect(500)

    expect(loggedEvents()).toEqual([{ subject: noSubject, what: 'PAGE_VIEW_ACCESS_ATTEMPT' }])
  })

  it.each([
    ['a prisoner photo', '/prisoner/A1234AA/image'],
    ['the redirect back to the start of a journey', '/back-to-start'],
  ])('does not audit %s', async (_name, url) => {
    await request(appWithAuditing()).get(url)

    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('does not audit when there is no signed-in user', async () => {
    await request(appWithAuditing({ userSupplier: () => ({}) as PrisonUser })).get('/help')

    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('still serves the page when auditing fails', async () => {
    auditService.logAuditEvent.mockRejectedValue(new Error('SQS is down'))

    await request(appWithAuditing()).get('/help').expect(200)
  })

  // no page in the service renders this way, so this calls the middleware directly
  it('leaves renders that pass their own callback alone', () => {
    const render = jest.fn()
    const req = { originalUrl: '/', query: {} } as Request
    const res = {
      locals: { user: { username: 'user1' } },
      render,
      prependOnceListener: jest.fn(),
    } as unknown as Response
    auditPageView(auditService)(req, res, jest.fn())

    const callback = jest.fn()
    res.render('emails/template', {}, callback)

    expect(render).toHaveBeenCalledWith('emails/template', {}, callback)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
