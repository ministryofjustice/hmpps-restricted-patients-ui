import { Expose } from 'class-transformer'
import PrisonerSearchResult from './prisonerSearchResult'

export default class RestrictedPatientSearchResult extends PrisonerSearchResult {
  @Expose()
  supportingPrisonId: string

  @Expose()
  dischargedHospitalDescription: string
}
