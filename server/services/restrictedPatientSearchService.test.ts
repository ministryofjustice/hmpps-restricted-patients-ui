import 'reflect-metadata'

import RestrictedPatientSearchService from './restrictedPatientSearchService'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import RestrictedPatientSearchResult from '../data/restrictedPatientSearchResult'
import PrisonApiClient, { Agency } from '../data/prisonApiClient'

import { Context } from './context'

jest.mock('../data/prisonerSearchClient')
jest.mock('../data/prisonApiClient')

const user = {
  token: 'token-1',
} as Context

const prisonApiClient = new PrisonApiClient(null) as jest.Mocked<PrisonApiClient>
const prisonerSearchClient = new PrisonerSearchClient(null) as jest.Mocked<PrisonerSearchClient>

describe('restrictedPatientSearchService', () => {
  let service: RestrictedPatientSearchService

  beforeEach(() => {
    service = new RestrictedPatientSearchService(prisonApiClient, prisonerSearchClient)
    prisonApiClient.getAgenciesByType.mockResolvedValue([
      {
        agencyId: 'MDI',
        description: 'Moorland',
        longDescription: 'HMP Moorland',
        agencyType: 'INST',
        active: true,
      } as Agency,
      {
        agencyId: 'LEI',
        description: 'Leeds',
        longDescription: 'HMP Leeds',
        agencyType: 'INST',
        active: true,
      } as Agency,
    ])
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('search', () => {
    it('search by prisoner identifier', async () => {
      prisonerSearchClient.restrictedPatientSearch.mockResolvedValue([
        {
          alerts: [
            { alertType: 'T', alertCode: 'TCPA' },
            { alertType: 'X', alertCode: 'XCU' },
          ],
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonerNumber: 'A1234AA',
          supportingPrisonId: 'MDI',
          dischargedHospitalDescription: 'Hazelwood House',
        } as RestrictedPatientSearchResult,
        {
          alerts: [],
          firstName: 'STEVE',
          lastName: 'JONES',
          prisonerNumber: 'A1234AB',
          supportingPrisonId: 'DNI',
          dischargedHospitalDescription: 'Yew Trees',
        } as RestrictedPatientSearchResult,
      ])

      const results = await service.search({ searchTerm: 'a1234aA' }, user)
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ displayName: 'Jones, Steve' }),
          expect.objectContaining({ displayName: 'Smith, John' }),
        ]),
      )

      expect(prisonerSearchClient.restrictedPatientSearch).toHaveBeenCalledWith(
        { prisonerIdentifier: 'A1234AA' },
        user.token,
      )
    })

    it('search by prisoner name', async () => {
      prisonerSearchClient.restrictedPatientSearch.mockResolvedValue([
        {
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonerNumber: 'A1234AA',
          supportingPrisonId: 'MDI',
        } as RestrictedPatientSearchResult,
      ])

      const results = await service.search({ searchTerm: 'Smith, John' }, user)
      expect(results).toEqual(expect.arrayContaining([expect.objectContaining({ displayName: 'Smith, John' })]))
      expect(prisonerSearchClient.restrictedPatientSearch).toHaveBeenCalledWith(
        { lastName: 'Smith', firstName: 'John' },
        user.token,
      )
    })

    it('search by prisoner surname only', async () => {
      await service.search({ searchTerm: 'Smith' }, user)
      expect(prisonerSearchClient.restrictedPatientSearch).toHaveBeenCalledWith({ lastName: 'Smith' }, user.token)
    })

    it('search by prisoner name separated by a space', async () => {
      await service.search({ searchTerm: 'Smith John' }, user)
      expect(prisonerSearchClient.restrictedPatientSearch).toHaveBeenCalledWith(
        { lastName: 'Smith', firstName: 'John' },
        user.token,
      )
    })

    it('search by prisoner name separated by many spaces', async () => {
      await service.search({ searchTerm: '    Smith   John ' }, user)
      expect(prisonerSearchClient.restrictedPatientSearch).toHaveBeenCalledWith(
        { lastName: 'Smith', firstName: 'John' },
        user.token,
      )
    })

    it('search by prisoner identifier with extra spaces', async () => {
      await service.search({ searchTerm: '    A1234AA ' }, user)
      expect(prisonerSearchClient.restrictedPatientSearch).toHaveBeenCalledWith(
        { prisonerIdentifier: 'A1234AA' },
        user.token,
      )
    })

    it('augments supporting prison with description', async () => {
      prisonerSearchClient.restrictedPatientSearch.mockResolvedValue([
        {
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonerNumber: 'A1234AA',
          supportingPrisonId: 'MDI',
        } as RestrictedPatientSearchResult,
        {
          firstName: 'JOHN',
          lastName: 'SMITH',
          prisonerNumber: 'A1234AA',
          supportingPrisonId: 'LEI',
        } as RestrictedPatientSearchResult,
      ])

      const results = await service.search({ searchTerm: 'Smith, John' }, user)
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ supportingPrisonId: 'MDI', supportingPrisonDescription: 'Moorland' }),
          expect.objectContaining({ supportingPrisonId: 'LEI', supportingPrisonDescription: 'Leeds' }),
        ]),
      )
    })
  })
})
