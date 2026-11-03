import type { AuditService } from '@ministryofjustice/hmpps-audit-client'
import { Request, Response } from 'express'
import auditAction from '../../utils/auditAction'
import PrisonerSearchService from '../../services/prisonerSearchService'
import AgencySearchService from '../../services/agencySearchService'
import MigratePrisonerService from '../../services/migratePrisonerService'

export default class AddPatientConfirmationRoutes {
  constructor(
    private readonly migratePrisonerService: MigratePrisonerService,
    private readonly prisonerSearchService: PrisonerSearchService,
    private readonly agencySearchService: AgencySearchService,
    private readonly auditService: AuditService,
  ) {}

  private renderView = async (req: Request, res: Response): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const hospitalId = req.query.hospitalId as string
    const { user } = res.locals

    const [hospital, prisoner] = await Promise.all([
      this.agencySearchService.getAgency(hospitalId, user),
      this.prisonerSearchService.getPrisonerDetails(prisonerNumber, user),
    ])

    return res.render('pages/addPatient/addPatientConfirmation', {
      prisoner,
      hospital,
    })
  }

  view = async (req: Request, res: Response): Promise<void> => this.renderView(req, res)

  submit = async (req: Request, res: Response): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const hospitalId = req.query.hospitalId as string
    const { user } = res.locals

    try {
      await this.migratePrisonerService.migrateToHospital(prisonerNumber, hospitalId, user)
      auditAction(this.auditService, req, res, {
        what: 'CREATE_RESTRICTED_PATIENT',
        subjectType: 'PRISONER_ID',
        subjectId: prisonerNumber,
        details: { journey: 'ADD_RESTRICTED_PATIENT', hospitalId },
      })

      return res.redirect(
        `/add-restricted-patient/prisoner-added?${new URLSearchParams({ prisonerNumber, hospitalId })}`,
      )
    } catch (error) {
      res.locals.redirectUrl = `/back-to-start`
      throw error
    }
  }
}
