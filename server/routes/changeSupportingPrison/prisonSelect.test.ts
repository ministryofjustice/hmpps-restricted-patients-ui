import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'
import RestrictedPatientSearchService, {
  RestrictedPatientSearchSummary,
} from '../../services/restrictedPatientSearchService'
import { Agency } from '../../data/prisonApiClient'
import AgencySearchService from '../../services/agencySearchService'

jest.mock('../../services/restrictedPatientSearchService')
jest.mock('../../services/agencySearchService')

const restrictedPatientSearchService = new RestrictedPatientSearchService(
  null,
  null,
) as jest.Mocked<RestrictedPatientSearchService>
const agencySearchService = new AgencySearchService(null) as jest.Mocked<AgencySearchService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    production: false,
    services: { restrictedPatientSearchService, agencySearchService },
    roles: ['RESTRICTED_PATIENT_MIGRATION'],
  })

  agencySearchService.getPrisons.mockResolvedValue([
    {
      agencyId: 'MDI',
      description: 'Moorland',
      longDescription: 'HMP Moorland',
      agencyType: 'INST',
      active: true,
    } as Agency,
  ])
  restrictedPatientSearchService.search.mockResolvedValue([
    {
      alerts: [
        { alertType: 'T', alertCode: 'TCPA' },
        { alertType: 'X', alertCode: 'XCU' },
      ],
      cellLocation: '1-2-015',
      firstName: 'John',
      lastName: 'Smith',
      displayName: 'Smith, John',
      prisonerNumber: 'A1234AA',
      supportingPrisonId: 'DNI',
      supportingPrisonDescription: 'HMP Doncaster',
      dischargedHospitalDescription: 'Yew Trees',
    } as unknown as RestrictedPatientSearchSummary,
  ])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /select-prison', () => {
  it('should load the change supporting prison page', () => {
    return request(app)
      .get('/change-supporting-prison/select-prison?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Select a supporting prison for John Smith')
        expect(res.text).toContain(
          '<img src="/prisoner/A1234AA/image" alt="Photograph of John Smith" class="horizontal-information__prisoner-image" />',
        )
        expect(res.text).toContain('Smith, John')
        expect(res.text).toContain('Yew Trees')
        expect(res.text).toContain('HMP Doncaster')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/change-supporting-prison/select-prison?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it('should render not found page if no results from search', () => {
    restrictedPatientSearchService.search.mockResolvedValue([])
    return request(app)
      .get('/change-supporting-prison/select-prison?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it('should render not found page if too many results from search', () => {
    restrictedPatientSearchService.search.mockResolvedValue([
      {} as unknown as RestrictedPatientSearchSummary,
      {} as unknown as RestrictedPatientSearchSummary,
    ])
    return request(app)
      .get('/change-supporting-prison/select-prison?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /change-supporting-prison', () => {
  it('should redirect to confirm change page with correct url parameters', () => {
    return request(app)
      .post('/change-supporting-prison/select-prison?prisonerNumber=A1234AA')
      .send({ prison: 'MDI' })
      .expect('Location', '/change-supporting-prison?prisonerNumber=A1234AA&prisonId=MDI')
  })

  it('should render validation messages', () => {
    return request(app)
      .post('/change-supporting-prison/select-prison?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: Select a supporting prison')
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('Enter a prison')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .post('/change-supporting-prison/select-prison?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
