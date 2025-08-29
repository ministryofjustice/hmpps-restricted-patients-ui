import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'

import config from '../config'
import RestrictedPatientApiClient, {
  RestrictedPatientAddRequest,
  RestrictedPatientDischargeToHospitalRequest,
} from './restrictedPatientApiClient'

describe('restrictedPatientApiClient', () => {
  let fakeRestrictedPatientApi: nock.Scope
  let client: RestrictedPatientApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  const token = 'token-1'

  const dischargeToHospitalRequest = {
    offenderNo: 'A1234AA',
    dischargeTime: new Date('2019-05-14T11:01:58.135Z'),
    fromLocationId: 'MDI',
    hospitalLocationCode: 'SHEFF',
    supportingPrisonId: 'MDI',
  } as RestrictedPatientDischargeToHospitalRequest

  const migrateToHospitalRequest = {
    offenderNo: 'A1234AA',
    hospitalLocationCode: 'SHEFF',
  } as RestrictedPatientAddRequest

  beforeEach(() => {
    fakeRestrictedPatientApi = nock(config.apis.restrictedPatientApi.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    client = new RestrictedPatientApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('dischargePatient', () => {
    it('makes the correct call and returns the response', async () => {
      const results: unknown = { restrictivePatient: { supportingPrisonId: 'MDI' } }
      fakeRestrictedPatientApi
        .post(`/discharge-to-hospital`, JSON.stringify(dischargeToHospitalRequest))
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.dischargePatient(dischargeToHospitalRequest, token)

      expect(output).toEqual(results)
      expect(nock.isDone()).toBe(true)
    })

    it('throws an error on 500', async () => {
      fakeRestrictedPatientApi
        .persist()
        .post(`/discharge-to-hospital`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(500)

      await client
        .dischargePatient(dischargeToHospitalRequest, token)
        .then(() => {
          // eslint-disable-next-line no-console
          console.log('Should not get here')
        })
        .catch(error => {
          expect(error.message).toEqual('Internal Server Error')
          nock.cleanAll()
        })
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('migratePatient', () => {
    it('makes the correct call and returns the response', async () => {
      const results: unknown = { restrictivePatient: { supportingPrisonId: 'MDI' } }
      fakeRestrictedPatientApi
        .post(`/migrate-in-restricted-patient`, JSON.stringify(migrateToHospitalRequest))
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.migratePatient(migrateToHospitalRequest, token)

      expect(output).toEqual(results)
      expect(nock.isDone()).toBe(true)
    })

    it('throws an error on 500', async () => {
      fakeRestrictedPatientApi
        .persist()
        .post(`/migrate-in-restricted-patient`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(500)

      await client
        .migratePatient(migrateToHospitalRequest, token)
        .then(() => {
          // eslint-disable-next-line no-console
          console.log('Should not get here')
        })
        .catch(error => {
          expect(error.message).toEqual('Internal Server Error')
          nock.cleanAll()
        })
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('getPatient', () => {
    it('makes the correct call and returns the response', async () => {
      const result = {
        hospitalLocation: {
          description: 'Sheffield Hospital',
        },
        prisonerNumber: 'A1234AA',
      }

      fakeRestrictedPatientApi
        .get('/restricted-patient/prison-number/A1234AA')
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, result)

      const response = await client.getPatient('A1234AA', token)

      expect(response).toEqual({
        hospitalLocation: {
          description: 'Sheffield Hospital',
        },
      })
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('removePatient', () => {
    it('works', async () => {
      fakeRestrictedPatientApi
        .delete('/restricted-patient/prison-number/A1234AA')
        .matchHeader('authorization', 'Bearer test-system-token')
        .reply(200)

      const response = await client.removePatient('A1234AA', 'user1')

      expect(response).toEqual({})
      expect(nock.isDone()).toBe(true)
    })
  })
})
