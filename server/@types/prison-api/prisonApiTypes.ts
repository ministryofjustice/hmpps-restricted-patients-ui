import { components } from './index'

export type Agency = Pick<components['schemas']['Agency'], 'agencyId' | 'description' | 'agencyType' | 'active'>
export type PrisonerResult = Pick<
  components['schemas']['InmateDetail'],
  'offenderNo' | 'firstName' | 'lastName' | 'assignedLivingUnit' | 'locationDescription' | 'categoryCode' | 'alerts'
>
