import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'
import PrisonerSearchService, { PrisonerResultSummary } from '../../services/prisonerSearchService'
import AgencySearchService from '../../services/agencySearchService'
import { Agency } from '../../@types/prison-api/prisonApiTypes'

jest.mock('../../services/prisonerSearchService')
jest.mock('../../services/agencySearchService')

const prisonerSearchService = new PrisonerSearchService(null, null) as jest.Mocked<PrisonerSearchService>
const agencySearchService = new AgencySearchService(null) as jest.Mocked<AgencySearchService>

let app: Express

describe('GET /prisoner-added', () => {
  beforeEach(() => {
    app = appWithAllRoutes({
      production: false,
      services: { prisonerSearchService, agencySearchService },
      session: { newAddRestrictedPatientJourney: true },
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
  it('should load the prisoner add completed page', () => {
    return request(app)
      .get('/add-restricted-patient/prisoner-added?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('John Smith has been added to Sheffield Hospital')
        expect(res.text).toContain('John Smith’s prison number is A1234AA')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/add-restricted-patient/prisoner-added?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
describe('GET /prisoner-added - no session item (user jumped to page)', () => {
  beforeEach(() => {
    app = appWithAllRoutes({ production: false, services: { prisonerSearchService } })

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
  it('should render not found', () => {
    return request(app)
      .get('/add-restricted-patient/prisoner-added?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/add-restricted-patient/prisoner-added?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
