import { AuthenticationClient, InMemoryTokenStore, RedisTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import { createRedisClient } from './redisClient'
import config from '../config'
import PrisonApiClient from './prisonApiClient'
import logger from '../../logger'
import ManageUsersApiClient from './manageUsersApiClient'
import PrisonerSearchClient from './prisonerSearchClient'
import RestrictedPatientApiClient from './restrictedPatientApiClient'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()

export const dataAccess = () => {
  const authenticationClient = new AuthenticationClient(
    config.apis.hmppsAuth,
    logger,
    config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore(),
  )

  return {
    applicationInfo,
    manageUsersApiClient: new ManageUsersApiClient(),
    prisonApiClient: new PrisonApiClient(authenticationClient),
    prisonerSearchClient: new PrisonerSearchClient(authenticationClient),
    restrictedPatientApiClient: new RestrictedPatientApiClient(authenticationClient),
  }
}

export { ManageUsersApiClient, PrisonApiClient }
