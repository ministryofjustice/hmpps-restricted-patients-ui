import MovePrisonerService from './movePrisonerService'

import { Context } from './context'
import RestrictedPatientApiClient from '../data/restrictedPatientApiClient'

jest.mock('../data/restrictedPatientApiClient')

const user = {
  username: 'user1',
  token: 'token-1',
} as Context

describe('movePrisonerService', () => {
  let service: MovePrisonerService
  const restrictedPatientApiClient = new RestrictedPatientApiClient(null) as jest.Mocked<RestrictedPatientApiClient>

  beforeEach(() => {
    service = new MovePrisonerService(restrictedPatientApiClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('dischargePatientToHospital', () => {
    beforeEach(() => {
      restrictedPatientApiClient.dischargePatient.mockResolvedValue({
        restrictedPatient: {
          supportingPrison: 'MDI',
        },
      })
    })

    it('makes the correct calls and returns the received data', async () => {
      const results = await service.dischargePatientToHospital('A1234AA', 'MDI', 'SHEFF', user)

      expect(restrictedPatientApiClient.dischargePatient).toHaveBeenCalledWith(
        {
          offenderNo: 'A1234AA',
          fromLocationId: 'MDI',
          hospitalLocationCode: 'SHEFF',
        },
        user.token,
      )
      expect(results).toStrictEqual({
        restrictedPatient: {
          supportingPrison: 'MDI',
        },
      })
    })
  })

  describe('changeSupportingPrison', () => {
    beforeEach(() => {
      restrictedPatientApiClient.changeSupportingPrison.mockResolvedValue({
        restrictedPatient: {
          supportingPrison: 'MDI',
        },
      })
    })

    it('makes the correct calls and returns the received data', async () => {
      const results = await service.changeSupportingPrison('A1234AA', 'MDI', user)

      expect(restrictedPatientApiClient.changeSupportingPrison).toHaveBeenCalledWith(
        {
          offenderNo: 'A1234AA',
          supportingPrisonId: 'MDI',
        },
        user.token,
      )
      expect(results).toStrictEqual({
        restrictedPatient: {
          supportingPrison: 'MDI',
        },
      })
    })
  })
})
