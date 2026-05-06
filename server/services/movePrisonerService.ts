import RestrictedPatientApiClient from '../data/restrictedPatientApiClient'

import { PrisonUser } from '../interfaces/hmppsUser'

export default class MovePrisonerService {
  constructor(private readonly client: RestrictedPatientApiClient) {}

  async dischargePatientToHospital(
    prisonerNumber: string,
    currentPrisonId: string,
    hospitalId: string,
    user: PrisonUser,
  ): Promise<unknown> {
    const request = {
      offenderNo: prisonerNumber,
      fromLocationId: currentPrisonId,
      hospitalLocationCode: hospitalId,
    }

    return this.client.dischargePatient(request, user.token)
  }

  async changeSupportingPrison(prisonerNumber: string, newPrisonId: string, user: PrisonUser): Promise<unknown> {
    const request = {
      offenderNo: prisonerNumber,
      supportingPrisonId: newPrisonId,
    }

    return this.client.changeSupportingPrison(request, user.token)
  }
}
