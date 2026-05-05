import AgencySearchService from './agencySearchService'
import PrisonApiClient from '../data/prisonApiClient'

import { Context } from './context'
import { Agency } from '../@types/prison-api/prisonApiTypes'

jest.mock('../data/prisonApiClient')

const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>

const user = {
  username: 'user1',
  token: 'token-1',
} as Context

describe('agencySearchService', () => {
  let service: AgencySearchService

  beforeEach(() => {
    service = new AgencySearchService(prisonApiClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getHospitals', () => {
    beforeEach(() => {
      prisonApiClient.getAgenciesByType
        .mockResolvedValue([
          {
            agencyId: 'SHEFF',
            description: 'Sheffield Hospital',
            agencyType: 'HOSPITAL',
            active: true,
          } as Agency,
          {
            agencyId: 'BURNLY',
            description: 'Burnley Hospital',
            agencyType: 'HOSPITAL',
            active: false,
          } as Agency,
        ])
        .mockResolvedValueOnce([
          {
            agencyId: 'ROTH',
            description: 'Rotherham Hospital',
            agencyType: 'HSHOSP',
            active: true,
          } as Agency,
        ])
    })

    it('makes the correct calls and returns the hospitals', async () => {
      const results = await service.getHospitals(user)

      expect(prisonApiClient.getAgenciesByType).toHaveBeenCalledWith('HOSPITAL', {
        tokenType: 'USER_TOKEN',
        user: { token: 'token-1' },
      })
      expect(prisonApiClient.getAgenciesByType).toHaveBeenCalledWith('HSHOSP', {
        tokenType: 'USER_TOKEN',
        user: { token: 'token-1' },
      })
      expect(results).toStrictEqual([
        {
          active: true,
          agencyId: 'ROTH',
          agencyType: 'HSHOSP',
          description: 'Rotherham Hospital',
        },
        {
          active: true,
          agencyId: 'SHEFF',
          agencyType: 'HOSPITAL',
          description: 'Sheffield Hospital',
        },
      ])
    })
  })

  describe('getPrisons', () => {
    beforeEach(() => {
      prisonApiClient.getAgenciesByType.mockResolvedValue([
        {
          agencyId: 'MDI',
          description: 'Moorland',
          agencyType: 'INST',
          active: true,
        } as Agency,
        {
          agencyId: 'DNI',
          description: 'Doncaster',
          agencyType: 'INST',
          active: false,
        } as Agency,
      ])
    })

    it('makes the correct calls and returns the prisons', async () => {
      const results = await service.getPrisons(user)

      expect(prisonApiClient.getAgenciesByType).toHaveBeenCalledWith('INST', {
        tokenType: 'USER_TOKEN',
        user: { token: 'token-1' },
      })
      expect(results).toStrictEqual([
        {
          active: true,
          agencyId: 'MDI',
          agencyType: 'INST',
          description: 'Moorland',
        },
      ])
    })
  })

  describe('getAgency', () => {
    beforeEach(() => {
      prisonApiClient.getAgencyDetails.mockResolvedValue({
        agencyId: 'SHEFF',
        description: 'Sheffield Hospital',
        agencyType: 'HOSPITAL',
        active: true,
      } as Agency)
    })

    it('makes the correct calls and returns the hospital details', async () => {
      const results = await service.getAgency('SHEFF', user)

      expect(prisonApiClient.getAgencyDetails).toHaveBeenCalledWith('SHEFF', {
        tokenType: 'USER_TOKEN',
        user: { token: 'token-1' },
      })
      expect(results).toStrictEqual({
        active: true,
        agencyId: 'SHEFF',
        agencyType: 'HOSPITAL',
        description: 'Sheffield Hospital',
      })
    })
  })
})
