import type { AuditService, SubjectType } from '@ministryofjustice/hmpps-audit-client'
import type { Request, Response } from 'express'

import logger from '../../logger'

/** HMPPS Audit rejects subject ids longer than this */
const maxSubjectIdLength = 80

export type AuditedAction = {
  /** e.g. SEARCH_PRISONER or CREATE_RESTRICTED_PATIENT - HMPPS Audit asks for a SEARCH_, CREATE_, EDIT_ or DELETE_ prefix */
  what: string
  subjectType: SubjectType
  subjectId: string
  details?: Record<string, unknown>
}

/**
 * Sends something the user did (a search or a change to restricted patient data) to HMPPS Audit.
 *
 * Page views are audited separately by the auditPageView middleware. Like page views, auditing must never
 * delay or break what the user is doing, so this does not wait for the message and never throws.
 */
export default function auditAction(auditService: AuditService, req: Request, res: Response, action: AuditedAction) {
  const who = res.locals.user?.username
  if (!who) return

  auditService
    .logAuditEvent(
      {
        ...action,
        who,
        correlationId: req.id,
        subjectId: action.subjectId.trim().substring(0, maxSubjectIdLength),
      },
      { throwOnError: false, logOnError: true },
    )
    .catch(error => {
      logger.error(error, `Failed to audit ${action.what}`)
    })
}
