import { components } from './index'

export type RestrictedPatientDto = Pick<components['schemas']['RestrictedPatientDto'], 'hospitalLocation'>
export type DischargeToHospitalRequest = components['schemas']['DischargeToHospitalRequest']
export type SupportingPrisonRequest = components['schemas']['SupportingPrisonRequest']
export type MigrateInRequest = components['schemas']['MigrateInRequest']
