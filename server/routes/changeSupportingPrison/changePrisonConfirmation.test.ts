import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'
import PrisonerSearchService, { PrisonerResultSummary } from '../../services/prisonerSearchService'
import AgencySearchService from '../../services/agencySearchService'
import MovePrisonerService from '../../services/movePrisonerService'
import { Agency } from '../../@types/prison-api/prisonApiTypes'

jest.mock('../../services/prisonerSearchService')
jest.mock('../../services/movePrisonerService')
jest.mock('../../services/agencySearchService')

const prisonerSearchService = new PrisonerSearchService(null, null) as jest.Mocked<PrisonerSearchService>
const agencySearchService = new AgencySearchService(null) as jest.Mocked<AgencySearchService>
const movePrisonerService = new MovePrisonerService(null) as jest.Mocked<MovePrisonerService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    production: false,
    services: { prisonerSearchService, agencySearchService, movePrisonerService },
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

describe('GET /', () => {
  it('should load the confirm add page', () => {
    return request(app)
      .get('/change-supporting-prison?prisonerNumber=A1234AA&prisonId=MDI')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You are changing John Smith’s supporting prison to Moorland')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/change-supporting-prison?prisonerNumber=A1234AA&prisonId=MDI')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /', () => {
  it('should redirect to prisoner-moved page on success', () => {
    movePrisonerService.changeSupportingPrison.mockResolvedValue({
      restrictivePatient: {
        supportingPrison: 'MDI',
      },
    })

    return request(app)
      .post('/change-supporting-prison?prisonerNumber=A1234AA&prisonId=MDI')
      .send({ currentAgencyId: 'MDI' })
      .expect('Location', '/change-supporting-prison/prisoner-changed?prisonerNumber=A1234AA&prisonId=MDI')
  })

  it('should throw an error on failure', () => {
    movePrisonerService.changeSupportingPrison.mockRejectedValue(new Error('some error'))

    return request(app)
      .post('/change-supporting-prison?prisonerNumber=A1234AA&prisonId=MDI')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: some error')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .post('/change-supporting-prison?prisonerNumber=A1234AA&prisonId=MDI')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
