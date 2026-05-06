import { components } from './index'

export type PrisonerSearchResult = Pick<
  components['schemas']['Prisoner'],
  | 'prisonerNumber'
  | 'firstName'
  | 'lastName'
  | 'cellLocation'
  | 'category'
  | 'sentenceExpiryDate'
  | 'alerts'
  | 'restrictedPatient'
  | 'locationDescription'
  | 'lastMovementTypeCode'
  | 'lastMovementReasonCode'
  | 'indeterminateSentence'
  | 'recall'
  | 'conditionalReleaseDate'
>

export type RestrictedPatientSearchResult = Pick<
  components['schemas']['Prisoner'],
  | 'prisonerNumber'
  | 'firstName'
  | 'lastName'
  | 'cellLocation'
  | 'category'
  | 'sentenceExpiryDate'
  | 'alerts'
  | 'restrictedPatient'
  | 'locationDescription'
  | 'lastMovementTypeCode'
  | 'lastMovementReasonCode'
  | 'indeterminateSentence'
  | 'recall'
  | 'conditionalReleaseDate'
  | 'supportingPrisonId'
  | 'dischargedHospitalDescription'
>

export type RestrictedPatientSearchResults = Pick<components['schemas']['PagePrisoner'], 'content'>
