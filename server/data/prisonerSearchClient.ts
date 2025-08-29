import { ApiConfig, asSystem, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { plainToClass } from 'class-transformer'

import config from '../config'
import PrisonerSearchResult from './prisonerSearchResult'
import logger from '../../logger'
import RestrictedPatientSearchResult from './restrictedPatientSearchResult'
import RestrictedPatientSearchResults from './restrictedPatientSearchResults'

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
    const results = await this.post<PrisonerSearchResult[]>(
      {
        path: `/prisoner-search/match-prisoners`,
        data: {
          includeAliases: false,
          ...searchRequest,
        },
      },
      asSystem(username),
    )

    return results.map(result => plainToClass(PrisonerSearchResult, result, { excludeExtraneousValues: true }))
  }

  async restrictedPatientSearch(
    searchRequest: RestrictedPatientSearchRequest,
    token: string,
  ): Promise<RestrictedPatientSearchResult[]> {
    const results = await this.post<RestrictedPatientSearchResults>(
      {
        path: `/restricted-patient-search/match-restricted-patients?size=3000`,
        data: { ...searchRequest },
      },
      asUser(token),
    )

    return results?.content.map(result =>
      plainToClass(RestrictedPatientSearchResult, result, { excludeExtraneousValues: true }),
    )
  }
}
