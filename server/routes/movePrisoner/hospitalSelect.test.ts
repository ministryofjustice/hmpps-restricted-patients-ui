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

beforeEach(() => {
  app = appWithAllRoutes({
    production: false,
    services: { prisonerSearchService, agencySearchService },
    roles: ['TRANSFER_RESTRICTED_PATIENT'],
  })

  agencySearchService.getHospitals.mockResolvedValue([
    {
      agencyId: 'SHEFF',
      description: 'Sheffield Hospital',
      agencyType: 'HOSPITAL',
      active: true,
    } as Agency,
  ])
  prisonerSearchService.getPrisonerDetails.mockResolvedValue({
    assignedLivingUnit: { description: '1-2-015' },
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

describe('GET /move-to-hospital', () => {
  it('should load the move prisoner to hospital page', () => {
    return request(app)
      .get('/move-to-hospital/select-hospital?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Move John Smith to a hospital')
        expect(res.text).toContain(
          '<img src="/prisoner/A1234AA/image" alt="Photograph of John Smith" class="horizontal-information__prisoner-image" />',
        )
        expect(res.text).toContain('Smith, John')
        expect(res.text).toContain('1-2-015')
        expect(res.text).toContain('Controlled unlock')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/move-to-hospital/select-hospital?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /move-to-hospital', () => {
  it('should redirect to confirm move page with correct url parameters', () => {
    return request(app)
      .post('/move-to-hospital/select-hospital?prisonerNumber=A1234AA')
      .send({ hospital: 'SHEFF' })
      .expect('Location', '/move-to-hospital/confirm-move?prisonerNumber=A1234AA&hospitalId=SHEFF')
  })

  it('should render validation messages', () => {
    return request(app)
      .post('/move-to-hospital/select-hospital?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: Move to a hospital')
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('Enter a hospital')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .post('/move-to-hospital/select-hospital?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
