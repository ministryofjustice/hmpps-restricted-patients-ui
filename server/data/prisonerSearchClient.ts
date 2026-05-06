import { ApiConfig, asSystem, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'

import config from '../config'
import logger from '../../logger'
import {
  PrisonerSearchResult,
  RestrictedPatientSearchResult,
  RestrictedPatientSearchResults,
} from '../@types/prisoner-search/prisonerSearchTypes'

export interface PrisonerSearchByPrisonerNumber {
  prisonerIdentifier: string
  prisonIds?: string[]
  includeAliases?: boolean
}

export interface PrisonerSearchByName {
  firstName: string
  lastName: string
  prisonIds?: string[]
  includeAliases?: boolean
}

export interface RestrictedPatientSearchByPrisonerNumber {
  prisonerIdentifier: string
}

export interface RestrictedPatientSearchByName {
  firstName: string
  lastName: string
}

export type RestrictedPatientSearchRequest = RestrictedPatientSearchByPrisonerNumber | RestrictedPatientSearchByName

type PrisonerSearchRequest = PrisonerSearchByPrisonerNumber | PrisonerSearchByName

export default class PrisonerSearchClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Prisoner Search', config.apis.prisonerSearch as ApiConfig, logger, authenticationClient)
  }

  async search(searchRequest: PrisonerSearchRequest, username: string): Promise<PrisonerSearchResult[]> {
    return this.post<PrisonerSearchResult[]>(
      {
        path: `/prisoner-search/match-prisoners`,
        query: { responseFieldsClient: 'restricted-patients' },
        data: {
          includeAliases: false,
          ...searchRequest,
        },
      },
      asSystem(username),
    )
  }

  async restrictedPatientSearch(
    searchRequest: RestrictedPatientSearchRequest,
    token: string,
  ): Promise<RestrictedPatientSearchResult[]> {
    return this.post<RestrictedPatientSearchResults>(
      {
        path: `/restricted-patient-search/match-restricted-patients`,
        query: { size: 3000, responseFieldsClient: 'restricted-patients' },
        data: { ...searchRequest },
      },
      asUser(token),
    ).then((results: RestrictedPatientSearchResults) => results?.content)
  }
}
