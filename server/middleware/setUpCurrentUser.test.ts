import jwt from 'jsonwebtoken'
import express from 'express'
import request from 'supertest'

import setUpCurrentUser from './setUpCurrentUser'
import type { Services } from '../services'
import UserService from '../services/userService'
import ManageUsersApiClient from '../data/manageUsersApiClient'

jest.mock('../services/userService')

const userService = new UserService({} as ManageUsersApiClient) as jest.Mocked<UserService>

function createToken() {
  const payload = {
    user_name: 'USER1',
    name: 'FIRST LAST',
    user_id: '12345',
    user_uuid: '11111111-1111-1111-1111-111111111111',
    auth_source: 'nomis',
    authorities: ['ROLE_PRISON', 'ROLE_RESTRICTED_PATIENT_MIGRATION'],
  }
  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

describe('setUpCurrentUser', () => {
  let locals: Express.Locals

  beforeEach(() => {
    userService.getUser.mockResolvedValue({
      username: 'USER1',
      active: true,
      name: 'First Last',
      authSource: 'nomis',
      activeCaseLoadId: 'MDI',
      userId: '12345',
      uuid: '11111111-1111-1111-1111-111111111111',
    })
  })

  const app = express()
  app.use((_req, res, next) => {
    res.locals.user = { token: createToken(), username: 'USER1', authSource: 'nomis' } as Express.Locals['user']
    next()
  })
  app.use(setUpCurrentUser({ userService } as unknown as Services))
  app.get('/', (_req, res) => {
    locals = res.locals
    res.send('ok')
  })

  it('takes the user UUID from the token so it is recorded in App Insights', async () => {
    await request(app).get('/').expect(200)

    expect(locals.user).toEqual(
      expect.objectContaining({
        username: 'USER1',
        userId: '12345',
        userUuid: '11111111-1111-1111-1111-111111111111',
        activeCaseLoadId: 'MDI',
        displayName: 'First Last',
        userRoles: ['PRISON', 'RESTRICTED_PATIENT_MIGRATION'],
      }),
    )
  })
})
