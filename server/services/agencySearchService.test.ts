import AgencySearchService from './agencySearchService'
import PrisonApiClient, { Agency } from '../data/prisonApiClient'

import { Context } from './context'

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
            longDescription: 'Sheffield Teaching Hospital',
            agencyType: 'HOSP',
            active: true,
          } as Agency,
          {
            agencyId: 'BURNLY',
            description: 'Burnley Hospital',
            longDescription: 'Burnley Teaching Hospital',
            agencyType: 'HOSP',
            active: false,
          } as Agency,
        ])
        .mockResolvedValueOnce([
          {
            agencyId: 'ROTH',
            description: 'Rotherham Hospital',
            longDescription: 'Rotherham General Hospital',
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
          longDescription: 'Rotherham General Hospital',
        },
        {
          active: true,
          agencyId: 'SHEFF',
          agencyType: 'HOSP',
          description: 'Sheffield Hospital',
          longDescription: 'Sheffield Teaching Hospital',
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
          longDescription: 'HMP Moorland',
          agencyType: 'INST',
          active: true,
        } as Agency,
        {
          agencyId: 'DNI',
          description: 'Doncaster',
          longDescription: 'HMP Doncaster',
          agencyType: 'INST',
          active: false,
        } as unknown as Agency,
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
          longDescription: 'HMP Moorland',
        },
      ])
    })
  })

  describe('getAgency', () => {
    beforeEach(() => {
      prisonApiClient.getAgencyDetails.mockResolvedValue({
        agencyId: 'SHEFF',
        description: 'Sheffield Hospital',
        longDescription: 'Sheffield Teaching Hospital',
        agencyType: 'HOSP',
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
        agencyType: 'HOSP',
        description: 'Sheffield Hospital',
        longDescription: 'Sheffield Teaching Hospital',
      })
    })
  })
})
