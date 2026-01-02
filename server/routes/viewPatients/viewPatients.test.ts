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
    roles: ['SEARCH_RESTRICTED_PATIENT'],
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /view-restricted-patients', () => {
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
          supportingPrisonDescription: 'HMP Doncaster',
          dischargedHospitalDescription: 'Yew Trees',
        } as unknown as RestrictedPatientSearchSummary,
      ])
    })

    it('should load the view restricted patients page', () => {
      return request(app)
        .get('/view-restricted-patients?searchTerm=Smith')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Viewing restricted patients')
          expect(res.text).toContain('<p class="align-right"><strong>People listed:</strong> 1</p>')
          expect(res.text).toContain(
            '<img src="/prisoner/A1234AA/image" alt="Photograph of Smith, John" class="results-table__image" />',
          )
          expect(res.text).toContain('Smith, John')
          expect(res.text).toContain('Yew Trees')
          expect(res.text).toContain('HMP Doncaster')
          expect(res.text).toContain(
            '<a href="http://localhost:3002/prisoner/A1234AA/add-case-note" class="govuk-link" data-qa="patient-add-case-note-link"><span class="govuk-visually-hidden">Smith, John - </span>Add a case note</a>',
          )
        })
    })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['REMOVE_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/view-restricted-patients?searchTerm=Smith')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  describe('without results', () => {
    beforeEach(() => {
      restrictedPatientSearchService.search.mockResolvedValue([])
    })

    it('should load the search for a patient page', () => {
      return request(app)
        .get('/view-restricted-patients?searchTerm=Smith')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Viewing restricted patients')
          expect(res.text).toContain('There are no results for the details you have entered.')
        })
    })
  })
})

describe('POST /view-restricted-patients', () => {
  it('should redirect to view restricted patients page with the correct search text', () => {
    return request(app)
      .post('/view-restricted-patients')
      .send({ searchTerm: 'Smith' })
      .expect('Location', '/view-restricted-patients?searchTerm=Smith')
  })

  it('should render validation messages', () => {
    return request(app)
      .post('/view-restricted-patients')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: Viewing restricted patients')
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('Enter a restricted patient’s name or prison number')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['REMOVE_RESTRICTED_PATIENT'] }))
    return request(app)
      .post('/view-restricted-patients')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
