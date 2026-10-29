import { Router } from 'express'

// Only paths on this site: a single leading slash, and no backslash (browsers treat '/\' like '//')
export const isLocalPath = (url: unknown): url is string =>
  typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')

export default function journeyStartRouter(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, _res, next) => {
    if (isLocalPath(req.query?.journeyStartUrl)) req.session.journeyStartUrl = req.query.journeyStartUrl
    next()
  })

  router.get('/back-to-start', async (req, res) => {
    const { journeyStartUrl } = req.session
    delete req.session.journeyStartUrl

    return res.redirect(isLocalPath(journeyStartUrl) ? journeyStartUrl : '/')
  })

  return router
}
