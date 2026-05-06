import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'
import PrisonerSearchService, { PrisonerResultSummary } from '../../services/prisonerSearchService'
import PrisonApiClient from '../../data/prisonApiClient'
import PrisonerSearchClient from '../../data/prisonerSearchClient'

jest.mock('../../services/prisonerSearchService')

const prisonerSearchService = new PrisonerSearchService(
  {} as PrisonApiClient,
  {} as PrisonerSearchClient,
) as jest.Mocked<PrisonerSearchService>

let app: Express

describe('GET /patient-removed', () => {
  beforeEach(() => {
    app = appWithAllRoutes({
      production: false,
      services: { prisonerSearchService },
      session: { newRemoveRestrictedPatientJourney: true },
      roles: ['REMOVE_RESTRICTED_PATIENT'],
    })

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
  it('should load the prisoner move completed page', () => {
    return request(app)
      .get('/remove-from-restricted-patients/patient-removed?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('John Smith has been removed from restricted patients')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/remove-from-restricted-patients/patient-removed?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('GET /patient-removed - no session item (user jumped to page)', () => {
  beforeEach(() => {
    app = appWithAllRoutes({ production: false, services: { prisonerSearchService } })

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
      .get('/remove-from-restricted-patients/patient-removed?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/remove-from-restricted-patients/patient-removed?prisonerNumber=A1234AA')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
