import express, { Router } from 'express'
import path from 'path'
import PrisonerSearchService from '../services/prisonerSearchService'
import authorisationMiddleware from '../middleware/authorisationMiddleware'

export default function prisonerRoutes({
  prisonerSearchService,
}: {
  prisonerSearchService: PrisonerSearchService
}): Router {
  const router = express.Router()

  router.use(
    authorisationMiddleware(true, [
      'SEARCH_RESTRICTED_PATIENT',
      'TRANSFER_RESTRICTED_PATIENT',
      'RESTRICTED_PATIENT_MIGRATION',
      'REMOVE_RESTRICTED_PATIENT',
    ]),
  )

  router.get('/:prisonerNumber/image', async (req, res) => {
    prisonerSearchService
      .getPrisonerImage(req.params.prisonerNumber, res.locals.user)
      .then(data => {
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(() => {
        const placeHolder = path.join(process.cwd(), '/dist/assets/images/image-missing.jpg')
        res.sendFile(placeHolder)
      })
  })

  return router
}
