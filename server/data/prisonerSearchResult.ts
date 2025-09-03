import { Expose, Type } from 'class-transformer'
import { Alert } from '@ministryofjustice/hmpps-connect-dps-shared-items'

export default class PrisonerSearchResult {
  @Expose()
  prisonerNumber: string

  @Expose()
  firstName: string

  @Expose()
  lastName: string

  @Expose()
  cellLocation: string

  @Expose()
  category: string

  @Type(() => Date)
  @Expose()
  sentenceExpiryDate: Date

  @Expose()
  alerts: Alert[]

  @Expose()
  restrictedPatient: boolean

  @Expose()
  locationDescription: string

  @Expose()
  lastMovementTypeCode: string

  @Expose()
  lastMovementReasonCode: string

  @Expose()
  indeterminateSentence: boolean

  @Expose()
  recall: boolean

  @Type(() => Date)
  @Expose()
  conditionalReleaseDate: Date
}
