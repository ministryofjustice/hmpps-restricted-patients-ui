import express, { Router } from 'express'

import HospitalSelectRoutes from './hospitalSelect'
import MovePrisonerService from '../../services/movePrisonerService'
import AgencySearchService from '../../services/agencySearchService'
import PrisonerSearchService from '../../services/prisonerSearchService'
import MovePrisonerConfirmationRoutes from './movePrisonerConfirmation'
import MovePrisonerCompletedRoutes from './movePrisonerCompleted'
import PrisonerSearchRoutes from './movePrisonerSearch'
import PrisonerSelectRoutes from './prisonerSelect'
import authorisationMiddleware from '../../middleware/authorisationMiddleware'

export default function movePrisonerRoutes({
  movePrisonerService,
  prisonerSearchService,
  agencySearchService,
}: {
  movePrisonerService: MovePrisonerService
  prisonerSearchService: PrisonerSearchService
  agencySearchService: AgencySearchService
}): Router {
  const router = express.Router({ mergeParams: true })
  router.use(authorisationMiddleware(true, ['TRANSFER_RESTRICTED_PATIENT']))

  const prisonerSearch = new PrisonerSearchRoutes()
  const prisonerSelect = new PrisonerSelectRoutes(prisonerSearchService)
  const movePrisoner = new HospitalSelectRoutes(agencySearchService, prisonerSearchService)
  const movePrisonerConfirmation = new MovePrisonerConfirmationRoutes(
    movePrisonerService,
    prisonerSearchService,
    agencySearchService,
  )
  const movePrisonerCompleted = new MovePrisonerCompletedRoutes(prisonerSearchService, agencySearchService)

  router.get('/search-for-prisoner', prisonerSearch.view)
  router.post('/search-for-prisoner', prisonerSearch.submit)

  router.get('/select-prisoner', prisonerSelect.view)
  router.post('/select-prisoner', prisonerSelect.submit)

  router.get('/select-hospital', movePrisoner.view)
  router.post('/select-hospital', movePrisoner.submit)

  router.get('/confirm-move', movePrisonerConfirmation.view)
  router.post('/confirm-move', movePrisonerConfirmation.submit)

  router.get('/prisoner-moved-to-hospital', movePrisonerCompleted.view)

  return router
}
