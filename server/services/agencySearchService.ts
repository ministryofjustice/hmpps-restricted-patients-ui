import { asUser } from '@ministryofjustice/hmpps-rest-client'

import PrisonApiClient from '../data/prisonApiClient'
import { Agency } from '../@types/prison-api/prisonApiTypes'
import { PrisonUser } from '../interfaces/hmppsUser'

export default class AgencySearchService {
  constructor(private readonly client: PrisonApiClient) {}

  async getHospitals(user: PrisonUser): Promise<Agency[]> {
    const [hospitalType, hshospType]: [Agency[], Agency[]] = await Promise.all([
      this.client.getAgenciesByType('HOSPITAL', asUser(user.token)),
      this.client.getAgenciesByType('HSHOSP', asUser(user.token)),
    ])

    return [...hospitalType, ...hshospType]
      .filter(h => h.active)
      .sort((a: Agency, b: Agency) => a.description.localeCompare(b.description))
  }

  async getPrisons(user: PrisonUser): Promise<Agency[]> {
    const prisons = await this.client.getAgenciesByType('INST', asUser(user.token))

    return prisons.filter(h => h.active).sort((a: Agency, b: Agency) => a.description.localeCompare(b.description))
  }

  async getAgency(agencyId: string, user: PrisonUser): Promise<Agency> {
    return this.client.getAgencyDetails(agencyId, asUser(user.token))
  }
}
