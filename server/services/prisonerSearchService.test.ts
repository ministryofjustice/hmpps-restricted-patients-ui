import { Readable } from 'stream'
import 'reflect-metadata'

import PrisonerSearchService, { PrisonerSearchSummary } from './prisonerSearchService'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import PrisonApiClient from '../data/prisonApiClient'

import { Context } from './context'
import PrisonerResult from '../data/prisonerResult'
import PrisonerSearchResult from '../data/prisonerSearchResult'

jest.mock('../data/prisonerSearchClient')
jest.mock('../data/prisonApiClient')

const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
const prisonerSearchClient = new PrisonerSearchClient(null) as jest.Mocked<PrisonerSearchClient>

const prisonIds = ['PR1', 'PR2']
const user = {
  username: 'user1',
  token: 'token-1',
} as Context

describe('prisonerSearchService', () => {
  let service: PrisonerSearchService

  beforeEach(() => {
    service = new PrisonerSearchService(prisonApiClient, prisonerSearchClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('search', () => {
    it('search by prisoner identifier', async () => {
      prisonerSearchClient.search.mockResolvedValue([
        {
          alerts: [
            { expired: false, alertType: 'T', alertCode: 'TCPA' },
            { expired: false, alertType: 'X', alertCode: 'XCU' },
          ],
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonerNumber: 'A1234AA',
          cellLocation: '1-2-015',
        } as PrisonerSearchResult,
        {
          alerts: [],
          firstName: 'STEVE',
          lastName: 'JONES',
          prisonerNumber: 'A1234AB',
          cellLocation: '1-2-016',
        } as PrisonerSearchResult,
      ])
      const results = await service.search({ searchTerm: 'a1234aA', prisonIds }, user)
      expect(results).toStrictEqual([
        {
          alerts: [],
          cellLocation: '1-2-016',
          displayName: 'Jones, Steve',
          firstName: 'STEVE',
          formattedAlerts: [],
          lastName: 'JONES',
          prisonerNumber: 'A1234AB',
        },
        {
          alerts: [
            {
              alertCode: 'TCPA',
              alertType: 'T',
              expired: false,
            },
            {
              alertCode: 'XCU',
              alertType: 'X',
              expired: false,
            },
          ],
          cellLocation: '1-2-015',
          displayName: 'Smith, John',
          formattedAlerts: [
            {
              alertCodes: ['XCU'],
              classes: 'alert-status alert-status--security',
              label: 'Controlled unlock',
            },
          ],
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonerNumber: 'A1234AA',
        },
      ])
      expect(prisonerSearchClient.search).toBeCalledWith({ prisonerIdentifier: 'A1234AA', prisonIds }, 'user1')
    })

    it('search by prisoner name', async () => {
      prisonerSearchClient.search.mockResolvedValue([
        {
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonerNumber: 'A1234AA',
        } as PrisonerSearchSummary,
      ])
      const results = await service.search({ searchTerm: 'Smith, John', prisonIds }, user)
      expect(results).toStrictEqual([
        {
          displayName: 'Smith, John',
          formattedAlerts: [],
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonerNumber: 'A1234AA',
        },
      ])
      expect(prisonerSearchClient.search).toBeCalledWith({ lastName: 'Smith', firstName: 'John', prisonIds }, 'user1')
    })

    it('search by prisoner surname only', async () => {
      await service.search({ searchTerm: 'Smith', prisonIds }, user)
      expect(prisonerSearchClient.search).toBeCalledWith({ lastName: 'Smith', prisonIds }, 'user1')
    })

    it('search by prisoner name separated by a space', async () => {
      await service.search({ searchTerm: 'Smith John', prisonIds }, user)
      expect(prisonerSearchClient.search).toBeCalledWith({ lastName: 'Smith', firstName: 'John', prisonIds }, 'user1')
    })

    it('search by prisoner name separated by many spaces', async () => {
      await service.search({ searchTerm: '    Smith   John ', prisonIds }, user)
      expect(prisonerSearchClient.search).toBeCalledWith({ lastName: 'Smith', firstName: 'John', prisonIds }, 'user1')
    })

    it('search by prisoner identifier with extra spaces', async () => {
      await service.search({ searchTerm: '    A1234AA ', prisonIds }, user)
      expect(prisonerSearchClient.search).toBeCalledWith({ prisonerIdentifier: 'A1234AA', prisonIds }, 'user1')
    })
  })

  describe('getPrisonerImage', () => {
    it('uses prison api to request image data', async () => {
      prisonApiClient.getPrisonerImage.mockResolvedValue(Readable.from('image data'))

      const result = await service.getPrisonerImage('A1234AA', {
        username: 'user1',
        token: 'token-1',
      })

      expect(result.read()).toEqual('image data')
      expect(prisonApiClient.getPrisonerImage).toBeCalledWith('A1234AA', {
        tokenType: 'SYSTEM_TOKEN',
        user: { username: 'user1' },
      })
    })
  })

  describe('getPrisonerDetails', () => {
    it('returns correctly formatted prisoner details', async () => {
      prisonApiClient.getPrisonerDetails.mockResolvedValue({
        offenderNo: 'A1234AA',
        firstName: 'JOHN',
        lastName: 'SMITH',
        assignedLivingUnit: { description: '1-2-015' },
        categoryCode: 'C',
        alerts: [
          { expired: false, alertType: 'T', alertCode: 'TCPA' },
          { expired: false, alertType: 'X', alertCode: 'XCU' },
          { expired: true, alertType: 'X', alertCode: 'XGANG' },
        ],
      } as PrisonerResult)

      const result = await service.getPrisonerDetails('A1234AA', {
        username: 'user1',
        token: 'token-1',
      })

      expect(result).toEqual({
        alerts: [
          { expired: false, alertCode: 'TCPA', alertType: 'T' },
          { expired: false, alertCode: 'XCU', alertType: 'X' },
          { expired: true, alertCode: 'XGANG', alertType: 'X' },
        ],
        assignedLivingUnit: { description: '1-2-015' },
        categoryCode: 'C',
        displayName: 'Smith, John',
        firstName: 'JOHN',
        formattedAlerts: [
          {
            alertCodes: ['XCU'],
            classes: 'alert-status alert-status--security',
            label: 'Controlled unlock',
          },
        ],
        friendlyName: 'John Smith',
        lastName: 'SMITH',
        offenderNo: 'A1234AA',
        prisonerNumber: 'A1234AA',
      })
      expect(prisonApiClient.getPrisonerDetails).toBeCalledWith('A1234AA', {
        tokenType: 'SYSTEM_TOKEN',
        user: { username: 'user1' },
      })
    })
  })
})
