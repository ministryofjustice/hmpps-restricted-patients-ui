import { asSystem, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'

import config from '../config'
import {
  DischargeToHospitalRequest,
  MigrateInRequest,
  RestrictedPatientDto,
  SupportingPrisonRequest,
} from '../@types/restricted-patients/restrictedPatientsApiTypes'
import logger from '../../logger'

export default class RestrictedPatientApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Restricted Patient', config.apis.restrictedPatientApi, logger, authenticationClient)
  }

  async dischargePatient(searchRequest: DischargeToHospitalRequest, token: string): Promise<unknown> {
    return this.post<DischargeToHospitalRequest>(
      {
        path: `/discharge-to-hospital`,
        data: { ...searchRequest },
      },
      asUser(token),
    )
  }

  async migratePatient(searchRequest: MigrateInRequest, token: string): Promise<unknown> {
    return this.post<MigrateInRequest>(
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

  async changeSupportingPrison(searchRequest: SupportingPrisonRequest, token: string): Promise<unknown> {
    return this.post<SupportingPrisonRequest>(
      {
        data: { ...searchRequest },
        path: `/change-supporting-prison`,
      },
      asUser(token),
    )
  }
}
