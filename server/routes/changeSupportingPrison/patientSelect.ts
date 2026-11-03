import type { AuditService } from '@ministryofjustice/hmpps-audit-client'
import { Request, Response } from 'express'
import auditAction from '../../utils/auditAction'
import RestrictedPatientSearchService, {
  RestrictedPatientSearchSummary,
} from '../../services/restrictedPatientSearchService'
import validateForm from '../searchPatients/restrictedPatientSearchValidation'
import { FormError } from '../../@types/template'

type PageData = {
  error?: FormError
  searchResults?: RestrictedPatientSearchSummary[]
  searchTerm: string
}

export default class RestrictedPatientSelectRoutes {
  constructor(
    private readonly restrictedPatientSearchService: RestrictedPatientSearchService,
    private readonly auditService: AuditService,
  ) {}

  private renderView = async (_req: Request, res: Response, pageData: PageData): Promise<void> => {
    const { error, searchResults, searchTerm } = pageData

    return res.render('pages/changePrison/patientSelect', {
      errors: error ? [error] : [],
      journeyStartUrl: `/change-supporting-prison/select-patient?searchTerm=${searchTerm}`,
      searchResults,
      searchTerm,
    })
  }

  view = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const searchTerm = JSON.stringify(req.query.searchTerm)?.replace(/"/g, '')

    if (!searchTerm) return res.redirect('/change-supporting-prison/search-for-patient')

    const searchResults = await this.restrictedPatientSearchService.search({ searchTerm }, user)

    auditAction(this.auditService, req, res, {
      what: 'SEARCH_RESTRICTED_PATIENT',
      subjectType: 'SEARCH_TERM',
      subjectId: searchTerm,
      details: { journey: 'CHANGE_SUPPORTING_PRISON' },
    })

    return this.renderView(req, res, { searchResults, searchTerm })
  }

  submit = async (req: Request, res: Response): Promise<void> => {
    const { searchTerm } = req.body || {}

    const error = validateForm({ searchTerm })

    if (error) return this.renderView(req, res, { error, searchTerm })

    return res.redirect(`/change-supporting-prison/select-patient?${new URLSearchParams({ searchTerm })}`)
  }
}
