import { asUser } from '@ministryofjustice/hmpps-rest-client'

import PrisonApiClient from '../data/prisonApiClient'
import RestrictedPatientApiClient from '../data/restrictedPatientApiClient'
import { convertToTitleCase } from '../utils/utils'

import { Context } from './context'
import { RestrictedPatientDto } from '../@types/restricted-patients/restrictedPatientsApiTypes'
import { PrisonerResult } from '../@types/prison-api/prisonApiTypes'

export interface RestrictedPatientDetails {
  displayName: string
  friendlyName: string
  hospital: string
  prisonerNumber: string
}

export default class RemoveRestrictedPatientService {
  constructor(
    private readonly prisonApiClient: PrisonApiClient,
    private readonly restrictedPatientApiClient: RestrictedPatientApiClient,
  ) {}

  async removeRestrictedPatient(prisonerNumber: string, user: Context): Promise<Record<string, unknown>> {
    return this.restrictedPatientApiClient.removePatient(prisonerNumber, user.username)
  }

  async getRestrictedPatient(prisonerNumber: string, user: Context): Promise<RestrictedPatientDetails> {
    const [patientDetails, prisonerDetails]: [RestrictedPatientDto, PrisonerResult] = await Promise.all([
      this.restrictedPatientApiClient.getPatient(prisonerNumber, user.token),
      this.prisonApiClient.getPrisonerDetails(prisonerNumber, asUser(user.token)),
    ])

    return {
      displayName: convertToTitleCase(`${prisonerDetails.lastName}, ${prisonerDetails.firstName}`),
      friendlyName: convertToTitleCase(`${prisonerDetails.firstName} ${prisonerDetails.lastName}`),
      hospital: patientDetails?.hospitalLocation?.description,
      prisonerNumber,
    }
  }
}
