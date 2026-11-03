import { Router } from 'express'

import prisonerRoutes from './prisonerRoutes'
import movePrisonerRoutes from './movePrisoner'
import viewPatientsRoutes from './viewPatients'
import removePatientRoutes from './removePatient'
import homepageRoutes from './homepage'
import changeSupportingPrisonRoutes from './changeSupportingPrison'

import addPrisonerRoutes from './addPatient'
import helpRoutes from './help'
import { Services } from '../services'

export default function routes({
  prisonerSearchService,
  restrictedPatientSearchService,
  movePrisonerService,
  removeRestrictedPatientService,
  userService,
  agencySearchService,
  migratePrisonerService,
  auditService,
}: Services): Router {
  const router = Router()
  router.use(
    '/move-to-hospital',
    movePrisonerRoutes({ auditService, movePrisonerService, prisonerSearchService, agencySearchService }),
  )
  router.use('/view-restricted-patients', viewPatientsRoutes({ auditService, restrictedPatientSearchService }))
  router.use(
    '/remove-from-restricted-patients',
    removePatientRoutes({
      auditService,
      removeRestrictedPatientService,
      restrictedPatientSearchService,
      prisonerSearchService,
    }),
  )
  router.use(
    '/add-restricted-patient',
    addPrisonerRoutes({ auditService, agencySearchService, prisonerSearchService, migratePrisonerService }),
  )
  router.use(
    '/change-supporting-prison',
    changeSupportingPrisonRoutes({
      auditService,
      agencySearchService,
      restrictedPatientSearchService,
      prisonerSearchService,
      movePrisonerService,
    }),
  )
  router.use('/prisoner', prisonerRoutes({ prisonerSearchService }))
  router.use('/help', helpRoutes())
  router.use('/', homepageRoutes({ userService }))

  return router
}
