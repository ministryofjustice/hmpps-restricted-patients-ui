import express, { Router } from 'express'

import PrisonerSearchService from '../../services/prisonerSearchService'
import ChangePrisonCompletedRoutes from './changePrisonCompleted'
import ChangePrisonConfirmationRoutes from './changePrisonConfirmation'
import authorisationMiddleware from '../../middleware/authorisationMiddleware'
import AgencySearchService from '../../services/agencySearchService'
import MovePrisonerService from '../../services/movePrisonerService'
import PrisonSelectRoutes from './prisonSelect'
import RestrictedPatientSearchRoutes from './patientSearch'
import RestrictedPatientSearchService from '../../services/restrictedPatientSearchService'
import RestrictedPatientSelectRoutes from './patientSelect'

export default function changeSupportingPrisonRoutes({
  agencySearchService,
  restrictedPatientSearchService,
  movePrisonerService,
  prisonerSearchService,
}: {
  agencySearchService: AgencySearchService
  restrictedPatientSearchService: RestrictedPatientSearchService
  movePrisonerService: MovePrisonerService
  prisonerSearchService: PrisonerSearchService
}): Router {
  const router = express.Router({ mergeParams: true })
  router.use(authorisationMiddleware(true, ['RESTRICTED_PATIENT_MIGRATION']))

  const patientSearch = new RestrictedPatientSearchRoutes()
  const patientSelect = new RestrictedPatientSelectRoutes(restrictedPatientSearchService)
  const prisonSelect = new PrisonSelectRoutes(agencySearchService, restrictedPatientSearchService)
  const changePrisonCompleted = new ChangePrisonCompletedRoutes(prisonerSearchService, agencySearchService)
  const changePrisonConfirmation = new ChangePrisonConfirmationRoutes(
    movePrisonerService,
    prisonerSearchService,
    agencySearchService,
  )

  router.get('/search-for-patient', patientSearch.view)
  router.post('/search-for-patient', patientSearch.submit)

  router.get('/select-patient', patientSelect.view)
  router.post('/select-patient', patientSelect.submit)

  router.get('/select-prison', prisonSelect.view)
  router.post('/select-prison', prisonSelect.submit)

  router.get('/', changePrisonConfirmation.view)
  router.post('/', changePrisonConfirmation.submit)

  router.get('/prisoner-changed', changePrisonCompleted.view)

  return router
}
