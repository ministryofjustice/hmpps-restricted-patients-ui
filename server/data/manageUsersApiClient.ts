import { ApiConfig, RestClient, asUser } from '@ministryofjustice/hmpps-rest-client'

import logger from '../../logger'
import config from '../config'
import { User } from '../@types/manage-users-api/manageUsersApiTypes'

export default class ManageUsersApiClient extends RestClient {
  constructor() {
    super('Manage Users Api Client', config.apis.manageUsersApi as ApiConfig, logger)
  }

  getUser(token: string): Promise<User> {
    return this.get<User>({ path: '/users/me' }, asUser(token))
  }
}
