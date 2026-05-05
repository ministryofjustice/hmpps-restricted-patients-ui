import ManageUsersApiClient from '../data/manageUsersApiClient'
import { User } from '../@types/manage-users-api/manageUsersApiTypes'

export default class UserService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  async getUser(token: string): Promise<User> {
    return this.manageUsersApiClient.getUser(token)
  }
}
