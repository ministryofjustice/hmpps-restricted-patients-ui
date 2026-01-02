import { Request, Response } from 'express'
import { FormError } from '../../@types/template'
import PrisonerSearchService, { PrisonerSearchSummary } from '../../services/prisonerSearchService'
import validateForm from '../searchPrisoners/prisonerSearchValidation'
import RestrictedPatientSearchFilter, { SearchStatus } from '../searchPatients/restrictedPatientSearchFilter'

type PageData = {
  error?: FormError
  searchResults?: PrisonerSearchSummary[]
}
export default class PrisonerSelectRoutes {
  constructor(private readonly prisonerSearchService: PrisonerSearchService) {}

  private searchFilter = new RestrictedPatientSearchFilter()

  private renderView = async (req: Request, res: Response, pageData: PageData): Promise<void> => {
    const { error, searchResults } = pageData

    return res.render('pages/movePrisoner/prisonerSelect', {
      errors: error ? [error] : [],
      searchResults,
    })
  }

  view = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const searchTerm = JSON.stringify(req.query.searchTerm)?.replace(/"/g, '')

    if (!searchTerm) return res.redirect('/move-to-hospital/search-for-prisoner')

    const searchResults = await this.prisonerSearchService.search(
      { searchTerm, prisonIds: [user.activeCaseLoadId] },
      user,
    )

    const availablePrisoners = searchResults
      .map(prisoner => {
        return { ...prisoner, searchStatus: this.searchFilter.includePrisonerToMove(prisoner) }
      })
      .filter(prisoner => prisoner.searchStatus !== SearchStatus.EXCLUDE)
      .map(prisoner => {
        return { ...prisoner, actionLink: this.addLink(prisoner, searchTerm) }
      })

    return this.renderView(req, res, { searchResults: availablePrisoners })
  }

  submit = async (req: Request, res: Response): Promise<void> => {
    const { searchTerm } = req.body || {}

    const error = validateForm({ searchTerm })

    if (error) return this.renderView(req, res, { error })

    return res.redirect(`/move-to-hospital/select-prisoner?${new URLSearchParams({ searchTerm })}`)
  }

  private addLink(prisoner: PrisonerSearchSummary, searchTerm: string): string {
    if (prisoner.searchStatus === SearchStatus.INCLUDE) {
      return `<a href="/move-to-hospital/select-hospital?prisonerNumber=${prisoner.prisonerNumber}&journeyStartUrl=/move-to-hospital/select-prisoner?searchTerm=${searchTerm}" class="govuk-link" data-qa="prisoner-move-to-hospital-link"><span class="govuk-visually-hidden">${prisoner.displayName} - </span>Move to a hospital</a>`
    }
    if (prisoner.searchStatus === SearchStatus.EXCLUDE_POST_CRD) {
      return `<p><span class="govuk-visually-hidden">${prisoner.displayName} - </span>Ineligible (past CRD)<br><a href="/help?section=restricted-patients-should-be-removed" class="govuk-link" data-qa="help-link" target="restricted_patients_help">View Help</a></p>`
    }
    if (prisoner.searchStatus === SearchStatus.EXCLUDE_POST_SED) {
      return `<p><span class="govuk-visually-hidden">${prisoner.displayName} - </span>Ineligible (past SED)<br><a href="/help?section=restricted-patients-should-be-removed" class="govuk-link" data-qa="help-link" target="restricted_patients_help">View Help</a></p>`
    }
    return ''
  }
}
