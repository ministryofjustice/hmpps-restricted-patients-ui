import type { AuditService } from '@ministryofjustice/hmpps-audit-client'
import { Request, Response } from 'express'
import auditAction from '../../utils/auditAction'
import RemoveRestrictedPatientService from '../../services/removeRestrictedPatientService'

export default class RemoveRestrictedPatientConfirmationRoutes {
  constructor(
    private readonly removeRestrictedPatientService: RemoveRestrictedPatientService,
    private readonly auditService: AuditService,
  ) {}

  private renderView = async (req: Request, res: Response): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const { user } = res.locals

    const patient = await this.removeRestrictedPatientService.getRestrictedPatient(prisonerNumber, user)

    return res.render('pages/removeRestrictedPatient/removeRestrictedPatientConfirmation', {
      patient,
    })
  }

  view = async (req: Request, res: Response): Promise<void> => this.renderView(req, res)

  submit = async (req: Request, res: Response): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const { user } = res.locals

    req.session.newRemoveRestrictedPatientJourney = true

    try {
      await this.removeRestrictedPatientService.removeRestrictedPatient(prisonerNumber, user)
      auditAction(this.auditService, req, res, {
        what: 'DELETE_RESTRICTED_PATIENT',
        subjectType: 'PRISONER_ID',
        subjectId: prisonerNumber,
        details: { journey: 'REMOVE_RESTRICTED_PATIENT' },
      })

      return res.redirect(`/remove-from-restricted-patients/patient-removed?${new URLSearchParams({ prisonerNumber })}`)
    } catch (error) {
      res.locals.redirectUrl = '/back-to-start'
      throw error
    }
  }
}
