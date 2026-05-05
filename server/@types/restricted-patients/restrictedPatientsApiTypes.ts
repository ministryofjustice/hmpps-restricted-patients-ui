import { components } from './index'

export type RestrictedPatientDto = Pick<components['schemas']['RestrictedPatientDto'], 'hospitalLocation'>
