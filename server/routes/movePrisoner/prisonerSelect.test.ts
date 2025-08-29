import 'reflect-metadata'
import { Express } from 'express'
import request from 'supertest'
import PrisonerSearchService, { PrisonerSearchSummary } from '../../services/prisonerSearchService'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'

jest.mock('../../services/prisonerSearchService')

const prisonerSearchService = new PrisonerSearchService(null, null) as jest.Mocked<PrisonerSearchService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    production: false,
    services: { prisonerSearchService },
    roles: ['TRANSFER_RESTRICTED_PATIENT'],
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /select-prisoner', () => {
  describe('with results', () => {
    beforeEach(() => {
      prisonerSearchService.search.mockResolvedValue([
        {
          alerts: [
            { alertType: 'T', alertCode: 'TCPA' },
            { alertType: 'X', alertCode: 'XCU' },
          ],
          cellLocation: '1-2-015',
          displayName: 'Smith, John',
          formattedAlerts: [
            {
              alertCodes: ['XCU'],
              classes: 'alert-status alert-status--controlled-unlock',
              label: 'Controlled unlock',
            },
          ],
          prisonerNumber: 'A1234AA',
          indeterminateSentence: true,
          recall: false,
        } as PrisonerSearchSummary,
        {
          alerts: [],
          cellLocation: '1-2-016',
          displayName: 'No move link - determinate sentence past CRD',
          formattedAlerts: [],
          prisonerNumber: 'A1235AA',
          recall: false,
          indeterminateSentence: false,
          conditionalReleaseDate: new Date(new Date().getDate() - 1),
        } as PrisonerSearchSummary,
        {
          alerts: [],
          cellLocation: '1-2-017',
          displayName: 'No move link - determinate recall past SED',
          formattedAlerts: [],
          prisonerNumber: 'A1236AA',
          recall: true,
          indeterminateSentence: false,
          sentenceExpiryDate: new Date(new Date().getDate() - 1),
        } as PrisonerSearchSummary,
      ])
    })

    it('should load the search for a prisoner page', () => {
      return request(app)
        .get('/move-to-hospital/select-prisoner?searchTerm=Smith')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Select a prisoner')
          expect(res.text).toContain('<p class="align-right"><strong>People listed:</strong> 3</p>')
          expect(res.text).toContain(
            '<img src="/prisoner/A1234AA/image" alt="Photograph of Smith, John" class="results-table__image" />',
          )
          expect(res.text).toContain('Smith, John')
          expect(res.text).toContain('1-2-015')
          expect(res.text).toContain('Controlled unlock')
          expect(res.text).toContain(
            '<a href="/move-to-hospital/select-hospital?prisonerNumber=A1234AA&journeyStartUrl=/move-to-hospital/select-prisoner?searchTerm=Smith" class="govuk-link" data-test="prisoner-move-to-hospital-link"><span class="govuk-visually-hidden">Smith, John - </span>Move to a hospital</a>',
          )
        })
    })

    it('should include post CRD and SED but without an add link', () => {
      return request(app)
        .get('/move-to-hospital/select-prisoner?searchTerm=Smith')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain(
            `<p><span class="govuk-visually-hidden">No move link - determinate sentence past CRD - </span>Ineligible (past CRD)<br><a href="/help?section=restricted-patients-should-be-removed" class="govuk-link" data-test="help-link" target="restricted_patients_help">View Help</a></p>`,
          )
          expect(res.text).toContain(
            `<p><span class="govuk-visually-hidden">No move link - determinate recall past SED - </span>Ineligible (past SED)<br><a href="/help?section=restricted-patients-should-be-removed" class="govuk-link" data-test="help-link" target="restricted_patients_help">View Help</a></p>`,
          )
        })
    })

    it('should render not found page if user missing privileges', () => {
      mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
      return request(app)
        .get('/move-to-hospital/select-prisoner?searchTerm=Smith')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Page not found')
        })
    })
  })

  describe('without results', () => {
    beforeEach(() => {
      prisonerSearchService.search.mockResolvedValue([])
    })

    it('should load the search for a prisoner page', () => {
      return request(app)
        .get('/move-to-hospital/select-prisoner?searchTerm=Smith')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Select a prisoner')
          expect(res.text).toContain('There are no results for the details you have entered.')
        })
    })
  })
})

describe('POST /select-prisoner', () => {
  it('should redirect to select prisoner page with the correct search text', () => {
    return request(app)
      .post('/move-to-hospital/select-prisoner')
      .send({ searchTerm: 'Smith' })
      .expect('Location', '/move-to-hospital/select-prisoner?searchTerm=Smith')
  })

  it('should render validation messages', () => {
    return request(app)
      .post('/move-to-hospital/select-prisoner')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: Select a prisoner')
        expect(res.text).toContain('There is a problem')
        expect(res.text).toContain('Enter a prisoner’s name or number')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .post('/move-to-hospital/select-prisoner')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
