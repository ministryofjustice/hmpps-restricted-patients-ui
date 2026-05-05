import { asSystem, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'

import config from '../config'
import { RestrictedPatientDto } from '../@types/restricted-patients/restrictedPatientsApiTypes'
import logger from '../../logger'

export interface RestrictedPatientDischargeToHospitalRequest {
  offenderNo: string
  commentText?: string
  fromLocationId: string
  hospitalLocationCode: string
  supportingPrisonId?: string
}
export interface RestrictedPatientAddRequest {
  offenderNo: string
  hospitalLocationCode: string
}
export interface ChangeSupportingPrisonRequest {
  offenderNo: string
  supportingPrisonId: string
}

export default class RestrictedPatientApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Restricted Patient', config.apis.restrictedPatientApi, logger, authenticationClient)
  }

  async dischargePatient(searchRequest: RestrictedPatientDischargeToHospitalRequest, token: string): Promise<unknown> {
    return this.post<RestrictedPatientDischargeToHospitalRequest>(
      {
        path: `/discharge-to-hospital`,
        data: { ...searchRequest },
      },
      asUser(token),
    )
  }

  async migratePatient(searchRequest: RestrictedPatientAddRequest, token: string): Promise<unknown> {
    return this.post<RestrictedPatientAddRequest>(
      {
        path: `/migrate-in-restricted-patient`,
        data: { ...searchRequest },
      },
      asUser(token),
    )
  }

  async getPatient(prisonerNumber: string, token: string): Promise<RestrictedPatientDto> {
    return this.get<RestrictedPatientDto>(
      {
        path: `/restricted-patient/prison-number/${prisonerNumber}`,
      },
      asUser(token),
    )
  }

  async removePatient(prisonerNumber: string, username: string): Promise<Record<string, unknown>> {
    return this.delete<Record<string, unknown>>(
      {
        path: `/restricted-patient/prison-number/${prisonerNumber}`,
      },
      asSystem(username),
    )
  }

  async changeSupportingPrison(searchRequest: ChangeSupportingPrisonRequest, token: string): Promise<unknown> {
    return this.post<ChangeSupportingPrisonRequest>(
      {
        path: `/change-supporting-prison`,
        data: { ...searchRequest },
      },
      asUser(token),
    )
  }
}
