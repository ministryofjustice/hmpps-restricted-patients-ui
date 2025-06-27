import express, { Router } from 'express'

import RestrictedPatientSearchService from '../../services/restrictedPatientSearchService'

import ViewPatientsRoutes from './viewPatients'
import RestrictedPatientSearchRoutes from './viewPatientsSearch'
import authorisationMiddleware from '../../middleware/authorisationMiddleware'

export default function viewPatientsRoutes({
  restrictedPatientSearchService,
}: {
  restrictedPatientSearchService: RestrictedPatientSearchService
}): Router {
  const router = express.Router()
  router.use(authorisationMiddleware(true, ['SEARCH_RESTRICTED_PATIENT']))

  const viewPatients = new ViewPatientsRoutes(restrictedPatientSearchService)
  const restrictedPatientSearch = new RestrictedPatientSearchRoutes()

  router.get('/search-for-patient', restrictedPatientSearch.view)
  router.post('/search-for-patient', restrictedPatientSearch.submit)

  router.get('/', viewPatients.view)
  router.post('/', viewPatients.submit)

  return router
}
