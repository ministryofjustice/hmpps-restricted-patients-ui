import 'reflect-metadata'
import { Express } from 'express'
import request from 'supertest'
import RestrictedPatientSearchService, {
  RestrictedPatientSearchSummary,
} from '../../services/restrictedPatientSearchService'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'

jest.mock('../../services/restrictedPatientSearchService')

const restrictedPatientSearchService = new RestrictedPatientSearchService(
  null,
  null,
) as jest.Mocked<RestrictedPatientSearchService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    production: false,
    services: { restrictedPatientSearchService },
    roles: ['REMOVE_RESTRICTED_PATIENT'],
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /select-restricted-patient', () => {
  describe('with results', () => {
    beforeEach(() => {
      restrictedPatientSearchService.search.mockResolvedValue([
        {
          alerts: [
            { alertType: 'T', alertCode: 'TCPA' },
            { alertType: 'X', alertCode: 'XCU' },
          ],
          cellLocation: '1-2-015',
          displayName: 'Smith, John',
          prisonerNumber: 'A1234AA',
          supportingPrisonId: 'DNI',
          dischargedHospitalDescription: 'Yew Trees',
        } as RestrictedPatientSearchSummary,
      ])
    })

    it('should load the select restricted patients page', () => {
      return request(app)
        .get('/remove-from-restricted-patients/select-patient?searchTerm=Smith')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Select a restricted patient')
          expect(res.text).toContain('<p class="align-right"><strong>People listed:</strong> 1</p>')
          expect(res.text).toContain(
            '<img src="/prisoner/A1234AA/image" alt="Photograph of Smith, John" class="results-table__image" />',
          )
          expect(res.text).toContain('Smith, John')
          expect(res.text).toContain('Yew Trees')
          expect(res.text).toContain(
            '<a href="/remove-from-restricted-patients?prisonerNumber=A1234AA&journeyStartUrl=/remove-from-restricted-patients/select-patient?searchTerm=Smith" class="govuk-link" data-test="remove-restricted-patient-link"><span class="govuk-visually-hidden">Smith, John - </span>Remove as a restricted patient</a>',
          )
        })
    })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/remove-from-restricted-patients/select-patient?searchTerm=Smith')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  describe('without results', () => {
    beforeEach(() => {
      restrictedPatientSearchService.search.mockResolvedValue([])
    })

    it('should load the page with a validation message', () => {
      return request(app)
        .get('/remove-from-restricted-patients/select-patient?searchTerm=Smith')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Select a restricted patient')
          expect(res.text).toContain('There are no results for the details you have entered.')
        })
    })

    it('should redirect to search restricted patient page if no search text', () => {
      return request(app)
        .get('/remove-from-restricted-patients/select-patient')
        .expect('Location', '/remove-from-restricted-patients/search-for-patient')
    })
  })
})

describe('POST /select-restricted-patient', () => {
  it('should redirect to select restricted patient page with the correct search text', () => {
    return request(app)
      .post('/remove-from-restricted-patients/select-patient')
      .send({ searchTerm: 'Smith' })
      .expect('Location', '/remove-from-restricted-patients/select-patient?searchTerm=Smith')
  })

  it('should render validation messages', () => {
    return request(app)
      .post('/remove-from-restricted-patients/select-patient')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: Select a restricted patient')
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('Enter a restricted patient’s name or prison number')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .post('/remove-from-restricted-patients/select-patient')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
