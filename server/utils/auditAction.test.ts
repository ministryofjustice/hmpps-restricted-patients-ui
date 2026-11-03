import type { Request, Response } from 'express'
import { AuditService } from '@ministryofjustice/hmpps-audit-client'

import auditAction from './auditAction'

jest.mock('@ministryofjustice/hmpps-audit-client')

let auditService: jest.Mocked<AuditService>

const req = { id: 'correlation-id' } as Request
const resFor = (username?: string) => ({ locals: { user: username ? { username } : undefined } }) as unknown as Response

beforeEach(() => {
  auditService = new AuditService(null as never) as jest.Mocked<AuditService>
  auditService.logAuditEvent.mockResolvedValue(undefined)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('auditAction', () => {
  it('cuts the subject to the 80 characters HMPPS Audit accepts', () => {
    auditAction(auditService, req, resFor('user1'), {
      what: 'SEARCH_PRISONER',
      subjectType: 'SEARCH_TERM',
      subjectId: `  ${'a'.repeat(100)}  `,
    })

    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      {
        what: 'SEARCH_PRISONER',
        who: 'user1',
        correlationId: 'correlation-id',
        subjectType: 'SEARCH_TERM',
        subjectId: 'a'.repeat(80),
      },
      { throwOnError: false, logOnError: true },
    )
  })

  it('sends nothing when there is no signed-in user', () => {
    auditAction(auditService, req, resFor(), {
      what: 'SEARCH_PRISONER',
      subjectType: 'SEARCH_TERM',
      subjectId: 'Smith',
    })

    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('does not throw when the message cannot be sent', async () => {
    auditService.logAuditEvent.mockRejectedValue(new Error('queue unavailable'))

    expect(() =>
      auditAction(auditService, req, resFor('user1'), {
        what: 'DELETE_RESTRICTED_PATIENT',
        subjectType: 'PRISONER_ID',
        subjectId: 'A1234AA',
      }),
    ).not.toThrow()
    await new Promise(process.nextTick)
  })
})
