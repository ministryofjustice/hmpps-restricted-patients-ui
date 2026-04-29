import express, { Router } from 'express'
import { jwtDecode } from 'jwt-decode'
import { convertToTitleCase } from '../utils/utils'
import logger from '../../logger'
import type { Services } from '../services'
import { PrisonUser } from '../interfaces/hmppsUser'

export default function setUpCurrentUser({ userService }: Services): Router {
  const router = express.Router()

  router.use(async (_req, res, next) => {
    try {
      const {
        name,
        user_id: userId,
        authorities: roles = [],
      } = jwtDecode(res.locals.user.token) as {
        name?: string
        user_id?: string
        authorities?: string[]
      }

      const user = await userService.getUser(res.locals.user.token)

      res.locals.user = {
        ...res.locals.user,
        userId,
        name,
        ...user,
        displayName: convertToTitleCase(name),
        userRoles: roles.map(role => role.substring(role.indexOf('_') + 1)),
      } as PrisonUser

      next()
    } catch (error) {
      logger.error(error, `Failed to populate user details for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  })

  return router
}
