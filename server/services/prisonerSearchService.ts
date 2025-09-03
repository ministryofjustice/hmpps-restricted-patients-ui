import { Readable } from 'stream'
import { asSystem } from '@ministryofjustice/hmpps-rest-client'
import { AlertFlagLabel, getAlertFlagLabelsForAlerts } from '@ministryofjustice/hmpps-connect-dps-shared-items'

import type { PrisonerSearchByName, PrisonerSearchByPrisonerNumber } from '../data/prisonerSearchClient'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import PrisonApiClient from '../data/prisonApiClient'
import PrisonerSearchResult from '../data/prisonerSearchResult'

import { convertToTitleCase } from '../utils/utils'
import PrisonerResult from '../data/prisonerResult'
import type { SearchStatus } from '../routes/searchPatients/restrictedPatientSearchFilter'

import { Context } from './context'

export interface PrisonerSearchSummary extends PrisonerSearchResult {
  displayName: string
  formattedAlerts: AlertFlagLabel[]
  searchStatus?: SearchStatus
  actionLink?: string
}

export interface PrisonerResultSummary extends PrisonerResult {
  displayName: string
  formattedAlerts: AlertFlagLabel[]
  friendlyName: string
  prisonerNumber: string
}

// Anything with a number is considered not to be a name, so therefore an identifier (prison no, PNC no etc.)
const isPrisonerIdentifier = (searchTerm: string) => /\d/.test(searchTerm)

function searchByName(searchTerm: string, prisonIds: string[]): PrisonerSearchByName {
  const [lastName, firstName] = searchTerm.split(' ')
  return { lastName, firstName, prisonIds }
}

function searchByPrisonerIdentifier(searchTerm: string, prisonIds: string[]): PrisonerSearchByPrisonerNumber {
  return { prisonerIdentifier: searchTerm.toUpperCase(), prisonIds }
}

export interface PrisonerSearch {
  prisonIds: string[]
  searchTerm: string
}

export default class PrisonerSearchService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly prisonerSearchClient: PrisonerSearchClient,
  ) {}

  private static enhancePrisoner(prisoner: PrisonerSearchResult | PrisonerResult) {
    return {
      displayName: convertToTitleCase(`${prisoner.lastName}, ${prisoner.firstName}`),
      formattedAlerts: getAlertFlagLabelsForAlerts(prisoner.alerts),
    }
  }

  async search(search: PrisonerSearch, user: Context): Promise<PrisonerSearchSummary[]> {
    const searchTerm = search.searchTerm.replace(/,/g, ' ').replace(/\s\s+/g, ' ').trim()
    const { prisonIds } = search

    const searchRequest = isPrisonerIdentifier(searchTerm)
      ? searchByPrisonerIdentifier(searchTerm, prisonIds)
      : searchByName(searchTerm, prisonIds)

    const results = await this.prisonerSearchClient.search(searchRequest, user.username)

    const enhancedResults = results.map(prisoner => {
      return {
        ...prisoner,
        ...PrisonerSearchService.enhancePrisoner(prisoner),
      }
    })

    return enhancedResults.sort((a: PrisonerSearchSummary, b: PrisonerSearchSummary) =>
      a.displayName.localeCompare(b.displayName),
    )
  }

  async getPrisonerImage(prisonerNumber: string, user: Context): Promise<Readable> {
    return this.prisonApiClient.getPrisonerImage(prisonerNumber, asSystem(user.username))
  }

  async getPrisonerDetails(prisonerNumber: string, user: Context): Promise<PrisonerResultSummary> {
    const prisoner = await this.prisonApiClient.getPrisonerDetails(prisonerNumber, asSystem(user.username))

    return {
      ...prisoner,
      ...PrisonerSearchService.enhancePrisoner(prisoner),
      friendlyName: convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`),
      prisonerNumber: prisoner.offenderNo,
    }
  }
}
