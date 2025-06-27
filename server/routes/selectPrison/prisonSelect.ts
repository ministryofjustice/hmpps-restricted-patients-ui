import { Request, Response } from 'express'
import { FormError } from '../../@types/template'
import validateMovePrisonerForm from './prisonSelectValidation'
import { addSelect, convertToTitleCase } from '../../utils/utils'
import AgencySearchService from '../../services/agencySearchService'
import { Agency } from '../../data/prisonApiClient'
import logger from '../../../logger'
import RestrictedPatientSearchService, {
  RestrictedPatientSearchSummary,
} from '../../services/restrictedPatientSearchService'

type PageData = {
  error?: FormError
}

export default abstract class PrisonSelectRoutes {
  protected constructor(
    private readonly agencySearchService: AgencySearchService,
    private readonly restrictedPatientSearchService: RestrictedPatientSearchService,
    private readonly path: string,
    private readonly page: string,
  ) {}

  private renderView = async (req: Request, res: Response, pageData: PageData): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const { user } = res.locals
    const { error } = pageData

    const [prisons, prisoners]: [Agency[], RestrictedPatientSearchSummary[]] = await Promise.all([
      this.agencySearchService.getPrisons(user),
      this.restrictedPatientSearchService.search({ searchTerm: prisonerNumber }, user),
    ])
    if (prisoners.length !== 1) {
      logger.error(`Found ${prisoners.length} when searching for ${prisonerNumber}`)
      return res.render('pages/notFound.njk')
    }

    const formattedPrisons = addSelect(
      prisons.map(prison => ({
        value: prison.agencyId,
        text: prison.description,
      })),
      'Select a prison',
    )
    const prisoner = {
      ...prisoners[0],
      friendlyName: convertToTitleCase(`${prisoners[0].firstName} ${prisoners[0].lastName}`),
    }

    return res.render(this.page, {
      errors: error ? [error] : [],
      prisoner,
      formattedPrisons,
    })
  }

  view = async (req: Request, res: Response): Promise<void> => this.renderView(req, res, {})

  submit = async (req: Request, res: Response): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const { prison } = req.body || {}

    const error = validateMovePrisonerForm({ prison })

    if (error) return this.renderView(req, res, { error })

    this.startNewJourneyInSession(req)

    return res.redirect(`${this.path}?${new URLSearchParams({ prisonerNumber, prisonId: prison })}`)
  }

  protected abstract startNewJourneyInSession(req: Request): void
}
