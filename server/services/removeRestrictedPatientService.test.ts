import RemoveRestrictedPatientService, { RestrictedPatientDetails } from './removeRestrictedPatientService'
import RestrictedPatientApiClient from '../data/restrictedPatientApiClient'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerResult from '../data/prisonerResult'
import RestrictedPatientResult from '../data/restrictedPatientResult'

import { Context } from './context'

jest.mock('../data/restrictedPatientApiClient')
jest.mock('../data/prisonApiClient')

const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
const restrictedPatientApiClient = new RestrictedPatientApiClient(null) as jest.Mocked<RestrictedPatientApiClient>

const user = {
  username: 'user1',
  token: 'token-1',
} as Context

describe('removeRestrictedPatientService', () => {
  let service: RemoveRestrictedPatientService

  beforeEach(() => {
    service = new RemoveRestrictedPatientService(prisonApiClient, restrictedPatientApiClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('removeRestrictedPatient', () => {
    it('calls the correct api with the correct token and returns the correct response', async () => {
      restrictedPatientApiClient.removePatient.mockResolvedValue({})

      const response = await service.removeRestrictedPatient('A1234AA', user)

      expect(restrictedPatientApiClient.removePatient).toHaveBeenCalledWith('A1234AA', user.username)
      expect(response).toStrictEqual({})
    })
  })

  describe('getRestrictedPatient', () => {
    it('makes the correct calls and returns the correctly formatted data', async () => {
      prisonApiClient.getPrisonerDetails.mockResolvedValue({
        lastName: 'SMITH',
        firstName: 'JOHN',
      } as PrisonerResult)

      restrictedPatientApiClient.getPatient.mockResolvedValue({
        hospitalLocation: { description: 'Sheffield Hospital' },
      } as RestrictedPatientResult)

      const response = await service.getRestrictedPatient('A1234AA', user)

      expect(prisonApiClient.getPrisonerDetails).toHaveBeenCalledWith('A1234AA', {
        tokenType: 'USER_TOKEN',
        user: { token: 'token-1' },
      })
      expect(restrictedPatientApiClient.getPatient).toHaveBeenCalledWith('A1234AA', user.token)
      expect(response).toStrictEqual({
        displayName: 'Smith, John',
        friendlyName: 'John Smith',
        hospital: 'Sheffield Hospital',
        prisonerNumber: 'A1234AA',
      } as RestrictedPatientDetails)
    })
  })
})
