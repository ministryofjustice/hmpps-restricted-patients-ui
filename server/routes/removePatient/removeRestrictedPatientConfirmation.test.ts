import { Express } from 'express'
import request from 'supertest'
import RemoveRestrictedPatientService, { RestrictedPatientDetails } from '../../services/removeRestrictedPatientService'
import { appWithAllRoutes, mockJwtDecode } from '../testutils/appSetup'
import PrisonApiClient from '../../data/prisonApiClient'
import RestrictedPatientApiClient from '../../data/restrictedPatientApiClient'

jest.mock('../../services/removeRestrictedPatientService')

const removeRestrictedPatientService = new RemoveRestrictedPatientService(
  {} as PrisonApiClient,
  {} as RestrictedPatientApiClient,
) as jest.Mocked<RemoveRestrictedPatientService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    production: false,
    services: { removeRestrictedPatientService },
    roles: ['REMOVE_RESTRICTED_PATIENT'],
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/remove-from-restricted-patients', () => {
  beforeEach(() => {
    removeRestrictedPatientService.getRestrictedPatient.mockResolvedValue({
      displayName: 'Smith, John',
      friendlyName: 'John Smith',
      hospital: 'Sheffield Hospital',
      prisonerNumber: 'A1234AA',
    } as RestrictedPatientDetails)
  })

  describe('GET /remove-from-restricted-patients', () => {
    it('should load the remove from restricted patients selection playback page', () => {
      return request(app)
        .get('/remove-from-restricted-patients?prisonerNumber=A1234AA')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('You are removing John Smith from restricted patients')
        })
    })

    it('should render not found page if user missing privileges', () => {
      mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
      return request(app)
        .get('/remove-from-restricted-patients?prisonerNumber=A1234AA')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Page not found')
        })
    })
  })

  describe('POST /remove-from-restricted-patients', () => {
    describe('with a successful response', () => {
      beforeEach(() => {
        removeRestrictedPatientService.removeRestrictedPatient.mockResolvedValue({})
      })

      it('should redirect to the person moved confirmation page', () => {
        return request(app)
          .post('/remove-from-restricted-patients?prisonerNumber=A1234AA')
          .expect('Location', '/remove-from-restricted-patients/patient-removed?prisonerNumber=A1234AA')
      })
    })

    it('should render not found page if user missing privileges', () => {
      mockJwtDecode.mockImplementation(() => ({ authorities: ['SEARCH_RESTRICTED_PATIENT'] }))
      return request(app)
        .post('/remove-from-restricted-patients?prisonerNumber=A1234AA')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Page not found')
        })
    })

    describe('when there has been an error', () => {
      beforeEach(() => {
        removeRestrictedPatientService.removeRestrictedPatient.mockRejectedValue(new Error('some error'))
      })

      it('should throw the error', () => {
        return request(app)
          .post('/remove-from-restricted-patients?prisonerNumber=A1234AA')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Error: some error')
          })
      })
    })
  })
})
