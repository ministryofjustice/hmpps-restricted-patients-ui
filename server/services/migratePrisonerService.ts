import RestrictedPatientApiClient from '../data/restrictedPatientApiClient'

import { PrisonUser } from '../interfaces/hmppsUser'

export default class MigratePrisonerService {
  constructor(private readonly restrictedPatientApiClient: RestrictedPatientApiClient) {}

  async migrateToHospital(prisonerNumber: string, hospitalId: string, user: PrisonUser): Promise<unknown> {
    const request = {
      offenderNo: prisonerNumber,
      hospitalLocationCode: hospitalId,
    }

    return this.restrictedPatientApiClient.migratePatient(request, user.token)
  }
}
