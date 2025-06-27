import crypto from 'crypto'
import express, { Router, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import config from '../config'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64')
    next()
  })

  // Hash allows inline script pulled in from https://github.com/alphagov/govuk-frontend/blob/master/src/govuk/template.njk
  const scriptSrc = [
    "'self'",
    (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
    'code.jquery.com',
    "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='",
  ]
  const styleSrc = ["'self'", 'code.jquery.com', "'unsafe-inline'"]
  const imgSrc = ["'self'", 'code.jquery.com']
  const fontSrc = ["'self'"]

  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc,
          styleSrc,
          fontSrc,
          imgSrc,
          connectSrc: ["'self'"],
          formAction: ["'self'", config.dpsUrl],
          ...(config.production ? {} : { upgradeInsecureRequests: null }),
        },
      },
    }),
  )
  return router
}
