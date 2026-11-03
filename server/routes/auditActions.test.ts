import { Express } from 'express'
import request from 'supertest'
import { AuditService } from '@ministryofjustice/hmpps-audit-client'

import { appWithAllRoutes, user } from './testutils/appSetup'
import PrisonerSearchService from '../services/prisonerSearchService'
import RestrictedPatientSearchService from '../services/restrictedPatientSearchService'
import MigratePrisonerService from '../services/migratePrisonerService'
import MovePrisonerService from '../services/movePrisonerService'
import RemoveRestrictedPatientService from '../services/removeRestrictedPatientService'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import RestrictedPatientApiClient from '../data/restrictedPatientApiClient'

jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('../services/prisonerSearchService')
jest.mock('../services/restrictedPatientSearchService')
jest.mock('../services/migratePrisonerService')
jest.mock('../services/movePrisonerService')
jest.mock('../services/removeRestrictedPatientService')

const prisonerSearchService = new PrisonerSearchService(
  {} as PrisonApiClient,
  {} as PrisonerSearchClient,
) as jest.Mocked<PrisonerSearchService>
const restrictedPatientSearchService = new RestrictedPatientSearchService(
  {} as PrisonApiClient,
  {} as PrisonerSearchClient,
) as jest.Mocked<RestrictedPatientSearchService>
const migratePrisonerService = new MigratePrisonerService(
  {} as RestrictedPatientApiClient,
) as jest.Mocked<MigratePrisonerService>
const movePrisonerService = new MovePrisonerService(
  {} as RestrictedPatientApiClient,
) as jest.Mocked<MovePrisonerService>
const removeRestrictedPatientService = new RemoveRestrictedPatientService(
  {} as PrisonApiClient,
  {} as RestrictedPatientApiClient,
) as jest.Mocked<RemoveRestrictedPatientService>

let auditService: jest.Mocked<AuditService>
let app: Express

const correlationId = '4d0fd4da-ecc1-454d-8308-cdee6b8b91f7'

/** searches and changes sent to HMPPS Audit, leaving out the page views (covered by auditPageView.test.ts) */
function auditedActions() {
  return auditService.logAuditEvent.mock.calls
    .map(([event]) => event)
    .filter(event => !event.what.startsWith('PAGE_VIEW'))
}

beforeEach(() => {
  auditService = new AuditService(null as never) as jest.Mocked<AuditService>
  auditService.logAuditEvent.mockResolvedValue(undefined)
  prisonerSearchService.search.mockResolvedValue([])
  restrictedPatientSearchService.search.mockResolvedValue([])

  app = appWithAllRoutes({
    services: {
      auditService,
      prisonerSearchService,
      restrictedPatientSearchService,
      migratePrisonerService,
      movePrisonerService,
      removeRestrictedPatientService,
    },
    roles: [
      'SEARCH_RESTRICTED_PATIENT',
      'TRANSFER_RESTRICTED_PATIENT',
      'RESTRICTED_PATIENT_MIGRATION',
      'REMOVE_RESTRICTED_PATIENT',
    ],
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('auditing searches', () => {
  it.each([
    ['/add-restricted-patient/select-prisoner', 'SEARCH_PRISONER', 'ADD_RESTRICTED_PATIENT'],
    ['/move-to-hospital/select-prisoner', 'SEARCH_PRISONER', 'MOVE_TO_HOSPITAL'],
    ['/view-restricted-patients', 'SEARCH_RESTRICTED_PATIENT', 'VIEW_RESTRICTED_PATIENTS'],
    ['/change-supporting-prison/select-patient', 'SEARCH_RESTRICTED_PATIENT', 'CHANGE_SUPPORTING_PRISON'],
    ['/remove-from-restricted-patients/select-patient', 'SEARCH_RESTRICTED_PATIENT', 'REMOVE_RESTRICTED_PATIENT'],
  ])('%s sends %s with the search term', async (path, what, journey) => {
    await request(app).get(`${path}?searchTerm=Smith`).expect(200)

    expect(auditedActions()).toEqual([
      {
        what,
        who: user.username,
        correlationId,
        subjectType: 'SEARCH_TERM',
        subjectId: 'Smith',
        details: { journey },
      },
    ])
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ what }), {
      throwOnError: false,
      logOnError: true,
    })
  })

  it('does not send a search when there is no search term', async () => {
    await request(app).get('/view-restricted-patients').expect(302)

    expect(auditedActions()).toEqual([])
  })

  it('does not send a search when the search fails', async () => {
    restrictedPatientSearchService.search.mockRejectedValue(new Error('search failed'))

    await request(app).get('/view-restricted-patients?searchTerm=Smith')

    expect(auditedActions()).toEqual([])
  })

  it('still shows the results when the audit message cannot be sent', async () => {
    auditService.logAuditEvent.mockRejectedValue(new Error('queue unavailable'))

    await request(app).get('/view-restricted-patients?searchTerm=Smith').expect(200)
  })
})

describe('auditing changes to restricted patients', () => {
  it('adding a restricted patient sends CREATE_RESTRICTED_PATIENT', async () => {
    migratePrisonerService.migrateToHospital.mockResolvedValue({})

    await request(app).post('/add-restricted-patient/confirm-add?prisonerNumber=A1234AA&hospitalId=SHEFF').expect(302)

    expect(auditedActions()).toEqual([
      {
        what: 'CREATE_RESTRICTED_PATIENT',
        who: user.username,
        correlationId,
        subjectType: 'PRISONER_ID',
        subjectId: 'A1234AA',
        details: { journey: 'ADD_RESTRICTED_PATIENT', hospitalId: 'SHEFF' },
      },
    ])
  })

  it('moving a prisoner to hospital sends CREATE_RESTRICTED_PATIENT', async () => {
    movePrisonerService.dischargePatientToHospital.mockResolvedValue({})

    await request(app)
      .post('/move-to-hospital/confirm-move?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .send({ currentAgencyId: 'MDI' })
      .expect(302)

    expect(auditedActions()).toEqual([
      {
        what: 'CREATE_RESTRICTED_PATIENT',
        who: user.username,
        correlationId,
        subjectType: 'PRISONER_ID',
        subjectId: 'A1234AA',
        details: { journey: 'MOVE_TO_HOSPITAL', fromPrisonId: 'MDI', hospitalId: 'SHEFF' },
      },
    ])
  })

  it('changing the supporting prison sends EDIT_SUPPORTING_PRISON', async () => {
    movePrisonerService.changeSupportingPrison.mockResolvedValue({})

    await request(app).post('/change-supporting-prison?prisonerNumber=A1234AA&prisonId=LEI').expect(302)

    expect(auditedActions()).toEqual([
      {
        what: 'EDIT_SUPPORTING_PRISON',
        who: user.username,
        correlationId,
        subjectType: 'PRISONER_ID',
        subjectId: 'A1234AA',
        details: { journey: 'CHANGE_SUPPORTING_PRISON', supportingPrisonId: 'LEI' },
      },
    ])
  })

  it('removing a restricted patient sends DELETE_RESTRICTED_PATIENT', async () => {
    removeRestrictedPatientService.removeRestrictedPatient.mockResolvedValue({})

    await request(app).post('/remove-from-restricted-patients?prisonerNumber=A1234AA').expect(302)

    expect(auditedActions()).toEqual([
      {
        what: 'DELETE_RESTRICTED_PATIENT',
        who: user.username,
        correlationId,
        subjectType: 'PRISONER_ID',
        subjectId: 'A1234AA',
        details: { journey: 'REMOVE_RESTRICTED_PATIENT' },
      },
    ])
  })

  it.each([
    ['adding', () => migratePrisonerService.migrateToHospital, '/add-restricted-patient/confirm-add'],
    ['moving', () => movePrisonerService.dischargePatientToHospital, '/move-to-hospital/confirm-move'],
    ['changing', () => movePrisonerService.changeSupportingPrison, '/change-supporting-prison'],
    ['removing', () => removeRestrictedPatientService.removeRestrictedPatient, '/remove-from-restricted-patients'],
  ])('sends nothing when %s fails at the API', async (_action, apiCall, path) => {
    apiCall().mockRejectedValue(new Error('api failed'))

    await request(app).post(`${path}?prisonerNumber=A1234AA&hospitalId=SHEFF&prisonId=LEI`)

    expect(auditedActions()).toEqual([])
  })

  it('still completes the change when the audit message cannot be sent', async () => {
    auditService.logAuditEvent.mockRejectedValue(new Error('queue unavailable'))
    removeRestrictedPatientService.removeRestrictedPatient.mockResolvedValue({})

    await request(app)
      .post('/remove-from-restricted-patients?prisonerNumber=A1234AA')
      .expect(302)
      .expect('Location', '/remove-from-restricted-patients/patient-removed?prisonerNumber=A1234AA')
  })
})
