import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'
import PrisonerSearchService, { PrisonerResultSummary } from '../../services/prisonerSearchService'
import AgencySearchService from '../../services/agencySearchService'
import { Agency } from '../../@types/prison-api/prisonApiTypes'
import PrisonApiClient from '../../data/prisonApiClient'
import PrisonerSearchClient from '../../data/prisonerSearchClient'

jest.mock('../../services/prisonerSearchService')
jest.mock('../../services/agencySearchService')

const prisonerSearchService = new PrisonerSearchService(
  {} as PrisonApiClient,
  {} as PrisonerSearchClient,
) as jest.Mocked<PrisonerSearchService>
const agencySearchService = new AgencySearchService({} as PrisonApiClient) as jest.Mocked<AgencySearchService>

let app: Express

describe('GET /prisoner-changed', () => {
  beforeEach(() => {
    app = appWithAllRoutes({
      production: false,
      services: { prisonerSearchService, agencySearchService },
      session: { newChangeSupportingPrisonJourney: true },
      roles: ['RESTRICTED_PATIENT_MIGRATION'],
    })

    agencySearchService.getAgency.mockResolvedValue({
      agencyId: 'MDI',
      description: 'Moorland',
      agencyType: 'INST',
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
  it('should load the prison change completed page', () => {
    return request(app)
      .get('/change-supporting-prison/prisoner-changed?prisonerNumber=A1234AA&prisonId=MDI')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('The supporting prison for John Smith has been changed')
        expect(res.text).toContain('John Smith’s supporting prison is now Moorland')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/change-supporting-prison/prisoner-changed?prisonerNumber=A1234AA&prisonId=MDI')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
describe('GET /prisoner-changed - no session item (user jumped to page)', () => {
  beforeEach(() => {
    app = appWithAllRoutes({ production: false, services: { prisonerSearchService } })

    agencySearchService.getAgency.mockResolvedValue({
      agencyId: 'MDI',
      description: 'Moorland',
      agencyType: 'INST',
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
      .get('/change-supporting-prison/prisoner-changed?prisonerNumber=A1234AA&prisonId=MDI')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/change-supporting-prison/prisoner-changed?prisonerNumber=A1234AA&prisonId=MDI')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
