import { Request, Response } from 'express'
import PrisonerSearchService, { PrisonerResultSummary } from '../../services/prisonerSearchService'
import AgencySearchService from '../../services/agencySearchService'
import MovePrisonerService from '../../services/movePrisonerService'
import { Agency } from '../../@types/prison-api/prisonApiTypes'

export default class ChangePrisonConfirmationRoutes {
  constructor(
    private readonly movePrisonerService: MovePrisonerService,
    private readonly prisonerSearchService: PrisonerSearchService,
    private readonly agencySearchService: AgencySearchService,
  ) {}

  private renderView = async (req: Request, res: Response): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const prisonId = req.query.prisonId as string
    const { user } = res.locals

    const [prison, prisoner]: [Agency, PrisonerResultSummary] = await Promise.all([
      this.agencySearchService.getAgency(prisonId, user),
      this.prisonerSearchService.getPrisonerDetails(prisonerNumber, user),
    ])

    return res.render('pages/changePrison/changePrisonConfirmation', {
      prisoner,
      prison,
    })
  }

  view = async (req: Request, res: Response): Promise<void> => this.renderView(req, res)

  submit = async (req: Request, res: Response): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const prisonId = req.query.prisonId as string
    const { user } = res.locals

    try {
      await this.movePrisonerService.changeSupportingPrison(prisonerNumber, prisonId, user)

      return res.redirect(
        `/change-supporting-prison/prisoner-changed?${new URLSearchParams({ prisonerNumber, prisonId })}`,
      )
    } catch (error) {
      res.locals.redirectUrl = `/back-to-start`
      throw error
    }
  }
}
