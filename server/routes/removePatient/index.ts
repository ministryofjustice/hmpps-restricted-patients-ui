import express, { Router } from 'express'

import RemoveRestrictedPatientConfirmationRoutes from './removeRestrictedPatientConfirmation'

import RemoveRestrictedPatientService from '../../services/removeRestrictedPatientService'
import RestrictedPatientSearchRoutes from './removeRestrictedPatientSearch'
import RestrictedPatientSelectRoutes from './restrictedPatientSelect'
import RemoveRestrictedPatientCompletedRoutes from './removeRestrictedPatientCompleted'
import RestrictedPatientSearchService from '../../services/restrictedPatientSearchService'
import PrisonerSearchService from '../../services/prisonerSearchService'
import authorisationMiddleware from '../../middleware/authorisationMiddleware'

export default function removePatientRoutes({
  removeRestrictedPatientService,
  restrictedPatientSearchService,
  prisonerSearchService,
}: {
  removeRestrictedPatientService: RemoveRestrictedPatientService
  restrictedPatientSearchService: RestrictedPatientSearchService
  prisonerSearchService: PrisonerSearchService
}): Router {
  const router = express.Router({ mergeParams: true })
  router.use(authorisationMiddleware(true, ['REMOVE_RESTRICTED_PATIENT']))

  const confirmation = new RemoveRestrictedPatientConfirmationRoutes(removeRestrictedPatientService)
  const search = new RestrictedPatientSearchRoutes()
  const select = new RestrictedPatientSelectRoutes(restrictedPatientSearchService)
  const completed = new RemoveRestrictedPatientCompletedRoutes(prisonerSearchService)

  router.get('/search-for-patient', search.view)
  router.post('/search-for-patient', search.submit)

  router.get('/select-patient', select.view)
  router.post('/select-patient', select.submit)

  router.get('/patient-removed', completed.view)

  router.get('/', confirmation.view)
  router.post('/', confirmation.submit)

  return router
}
