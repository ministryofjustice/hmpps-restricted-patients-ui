import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'
import PrisonerSearchService, { PrisonerResultSummary } from '../../services/prisonerSearchService'
import AgencySearchService from '../../services/agencySearchService'
import MigratePrisonerService from '../../services/migratePrisonerService'
import { Agency } from '../../@types/prison-api/prisonApiTypes'

jest.mock('../../services/prisonerSearchService')
jest.mock('../../services/migratePrisonerService')
jest.mock('../../services/agencySearchService')

const prisonerSearchService = new PrisonerSearchService(null, null) as jest.Mocked<PrisonerSearchService>
const agencySearchService = new AgencySearchService(null) as jest.Mocked<AgencySearchService>
const migratePrisonerService = new MigratePrisonerService(null) as jest.Mocked<MigratePrisonerService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    production: false,
    services: { prisonerSearchService, agencySearchService, migratePrisonerService },
    roles: ['RESTRICTED_PATIENT_MIGRATION'],
  })

  agencySearchService.getAgency.mockResolvedValue({
    agencyId: 'SHEFF',
    description: 'Sheffield Hospital',
    agencyType: 'HOSPITAL',
    active: true,
  } as Agency)
  prisonerSearchService.getPrisonerDetails.mockResolvedValue({
    assignedLivingUnit: {
      agencyId: 'MDI',
      description: '1-2-015',
    },
    alerts: [
      { alertType: 'T', alertCode: 'TCPA' },
      { alertType: 'X', alertCode: 'XCU' },
    ],
    displayName: 'Smith, John',
    formattedAlerts: [
      {
        alertCodes: ['XCU'],
        classes: 'alert-status alert-status--controlled-unlock',
        label: 'Controlled unlock',
      },
    ],
    friendlyName: 'John Smith',
    prisonerNumber: 'A1234AA',
  } as PrisonerResultSummary)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /confirm-add', () => {
  it('should load the confirm add page', () => {
    return request(app)
      .get('/add-restricted-patient/confirm-add?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You are adding John Smith to Sheffield Hospital')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/add-restricted-patient/confirm-add?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /confirm-add', () => {
  it('should redirect to prisoner-moved page on success', () => {
    migratePrisonerService.migrateToHospital.mockResolvedValue({
      restrictivePatient: {
        supportingPrison: 'MDI',
      },
    })

    return request(app)
      .post('/add-restricted-patient/confirm-add?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .send({ currentAgencyId: 'MDI' })
      .expect('Location', '/add-restricted-patient/prisoner-added?prisonerNumber=A1234AA&hospitalId=SHEFF')
  })

  it('should throw an error on failure', () => {
    migratePrisonerService.migrateToHospital.mockRejectedValue(new Error('some error'))

    return request(app)
      .post('/add-restricted-patient/confirm-add?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: some error')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .post('/add-restricted-patient/confirm-add?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
