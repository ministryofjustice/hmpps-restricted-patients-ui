import { Router } from 'express'

export default function journeyStartRouter(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, _res, next) => {
    if (req.query?.journeyStartUrl) req.session.journeyStartUrl = req.query.journeyStartUrl
    next()
  })

  router.get('/back-to-start', async (req, res) => {
    const { journeyStartUrl = '/' } = req.session
    delete req.session.journeyStartUrl

    return res.redirect(journeyStartUrl)
  })

  return router
}
