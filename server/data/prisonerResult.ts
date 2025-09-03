import { Alert } from '@ministryofjustice/hmpps-connect-dps-shared-items'
import { Expose } from 'class-transformer'

type AssignedLivingUnit = {
  agencyId: string
  locationId: number
  description: string
  agencyName: string
}

export default class PrisonerResult {
  @Expose()
  offenderNo: string

  @Expose()
  firstName: string

  @Expose()
  lastName: string

  @Expose()
  assignedLivingUnit: AssignedLivingUnit

  @Expose()
  locationDescription: string

  @Expose()
  categoryCode: string

  @Expose()
  alerts: Alert[]
}
