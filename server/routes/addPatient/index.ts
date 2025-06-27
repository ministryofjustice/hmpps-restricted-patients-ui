import express, { Router } from 'express'

import PrisonerSearchService from '../../services/prisonerSearchService'
import PrisonerSearchRoutes from './prisonerSearch'
import PrisonerSelectRoutes from './prisonerSelect'
import AddPatientCompletedRoutes from './addPatientCompleted'
import AddPatientConfirmationRoutes from './addPatientConfirmation'
import authorisationMiddleware from '../../middleware/authorisationMiddleware'
import AgencySearchService from '../../services/agencySearchService'
import HospitalSelectRoutes from './hospitalSelect'
import MigratePrisonerService from '../../services/migratePrisonerService'

export default function addPrisonerRoutes({
  agencySearchService,
  prisonerSearchService,
  migratePrisonerService,
}: {
  prisonerSearchService: PrisonerSearchService
  agencySearchService: AgencySearchService
  migratePrisonerService: MigratePrisonerService
}): Router {
  const router = express.Router({ mergeParams: true })
  router.use(authorisationMiddleware(true, ['RESTRICTED_PATIENT_MIGRATION']))

  const prisonerSearch = new PrisonerSearchRoutes()
  const prisonerSelect = new PrisonerSelectRoutes(prisonerSearchService)
  const hospitalSelect = new HospitalSelectRoutes(agencySearchService, prisonerSearchService)
  const addPatientCompleted = new AddPatientCompletedRoutes(prisonerSearchService, agencySearchService)
  const addPatientConfirmation = new AddPatientConfirmationRoutes(
    migratePrisonerService,
    prisonerSearchService,
    agencySearchService,
  )

  router.get('/search-for-prisoner', prisonerSearch.view)
  router.post('/search-for-prisoner', prisonerSearch.submit)

  router.get('/select-prisoner', prisonerSelect.view)
  router.post('/select-prisoner', prisonerSelect.submit)

  router.get('/select-hospital', hospitalSelect.view)
  router.post('/select-hospital', hospitalSelect.submit)

  router.get('/confirm-add', addPatientConfirmation.view)
  router.post('/confirm-add', addPatientConfirmation.submit)

  router.get('/prisoner-added', addPatientCompleted.view)

  return router
}
