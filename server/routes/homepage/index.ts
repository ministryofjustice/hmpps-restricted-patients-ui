import express, { Router } from 'express'

import HomepageRoutes from './homepage'
import UserService from '../../services/userService'

export default function homepageRoutes({ userService }: { userService: UserService }): Router {
  const router = express.Router()

  const homepage = new HomepageRoutes(userService)

  router.get('/', homepage.view)
  return router
}
