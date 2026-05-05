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
    roles: ['RESTRICTED_PATIENT_MIGRATION'],
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
    locationDescription: 'Outside - released from Doncaster',
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

describe('GET /select-hospital', () => {
  it('should load the add restricted patient page', () => {
    return request(app)
      .get('/add-restricted-patient/select-hospital?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select a hospital for John Smith')
        expect(res.text).toContain(
          '<img src="/prisoner/A1234AA/image" alt="Photograph of John Smith" class="horizontal-information__prisoner-image" />',
        )
        expect(res.text).toContain('Smith, John')
        expect(res.text).toContain('Outside - released from Doncaster')
        expect(res.text).toContain('Controlled unlock')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/add-restricted-patient/select-hospital?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /add-restricted-patient', () => {
  it('should redirect to confirm add page with correct url parameters', () => {
    return request(app)
      .post('/add-restricted-patient/select-hospital?prisonerNumber=A1234AA')
      .send({ hospital: 'SHEFF' })
      .expect('Location', '/add-restricted-patient/confirm-add?prisonerNumber=A1234AA&hospitalId=SHEFF')
  })

  it('should render validation messages', () => {
    return request(app)
      .post('/add-restricted-patient/select-hospital?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: Select a hospital')
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('Enter a hospital')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .post('/add-restricted-patient/select-hospital?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
