import { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'
import PrisonerSearchService, { PrisonerResultSummary } from '../../services/prisonerSearchService'
import MovePrisonerService from '../../services/movePrisonerService'
import AgencySearchService from '../../services/agencySearchService'
import { Agency } from '../../@types/prison-api/prisonApiTypes'

jest.mock('../../services/prisonerSearchService')
jest.mock('../../services/movePrisonerService')
jest.mock('../../services/agencySearchService')

const prisonerSearchService = new PrisonerSearchService(null, null) as jest.Mocked<PrisonerSearchService>
const movePrisonerService = new MovePrisonerService(null) as jest.Mocked<MovePrisonerService>
const agencySearchService = new AgencySearchService(null) as jest.Mocked<AgencySearchService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    production: false,
    services: { prisonerSearchService, movePrisonerService, agencySearchService },
    roles: ['TRANSFER_RESTRICTED_PATIENT'],
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

describe('GET /confirm-move', () => {
  it('should load the confirm move page', () => {
    return request(app)
      .get('/move-to-hospital/confirm-move?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You are moving John Smith to Sheffield Hospital')
        expect(res.text).toContain('<input type="hidden" name="currentAgencyId" value="MDI"')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .get('/move-to-hospital/confirm-move?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})

describe('POST /confirm-move', () => {
  it('should redirect to prisoner-moved page on success', () => {
    movePrisonerService.dischargePatientToHospital.mockResolvedValue({
      restrictivePatient: {
        supportingPrison: 'MDI',
      },
    })

    return request(app)
      .post('/move-to-hospital/confirm-move?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .send({ currentAgencyId: 'MDI' })
      .expect('Location', '/move-to-hospital/prisoner-moved-to-hospital?prisonerNumber=A1234AA&hospitalId=SHEFF')
  })

  it('should throw an error on failure', () => {
    movePrisonerService.dischargePatientToHospital.mockRejectedValue(new Error('some error'))

    return request(app)
      .post('/move-to-hospital/confirm-move?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Error: some error')
      })
  })

  it('should render not found page if user missing privileges', () => {
    mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
    return request(app)
      .post('/move-to-hospital/confirm-move?prisonerNumber=A1234AA&hospitalId=SHEFF')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
      })
  })
})
