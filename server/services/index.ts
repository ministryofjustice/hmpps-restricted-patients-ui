import { AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'

import logger from '../../logger'
import config from '../config'
import { dataAccess } from '../data'
import UserService from './userService'
import PrisonerSearchService from './prisonerSearchService'
import MovePrisonerService from './movePrisonerService'
import RestrictedPatientSearchService from './restrictedPatientSearchService'
import RemoveRestrictedPatientService from './removeRestrictedPatientService'
import AgencySearchService from './agencySearchService'
import MigratePrisonerService from './migratePrisonerService'

export const services = () => {
  const { applicationInfo, manageUsersApiClient, prisonApiClient, prisonerSearchClient, restrictedPatientApiClient } =
    dataAccess()

  return {
    applicationInfo,
    auditService: AuditServiceFactory.createInstance(config.sqs.audit, logger),
    userService: new UserService(manageUsersApiClient),
    prisonerSearchService: new PrisonerSearchService(prisonApiClient, prisonerSearchClient),
    movePrisonerService: new MovePrisonerService(restrictedPatientApiClient),
    restrictedPatientSearchService: new RestrictedPatientSearchService(prisonApiClient, prisonerSearchClient),
    removeRestrictedPatientService: new RemoveRestrictedPatientService(prisonApiClient, restrictedPatientApiClient),
    agencySearchService: new AgencySearchService(prisonApiClient),
    migratePrisonerService: new MigratePrisonerService(restrictedPatientApiClient),
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
