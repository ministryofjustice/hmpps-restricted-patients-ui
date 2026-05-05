import { Request, Response } from 'express'
import PrisonerSearchService, { PrisonerResultSummary } from '../../services/prisonerSearchService'
import AgencySearchService from '../../services/agencySearchService'
import { Agency } from '../../@types/prison-api/prisonApiTypes'

export default class ChangePrisonCompletedRoutes {
  constructor(
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

    return res.render('pages/changePrison/changePrisonCompleted', {
      prisoner,
      prison,
    })
  }

  view = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.newChangeSupportingPrisonJourney) return res.render('pages/notFound.njk')
    delete req.session.newChangeSupportingPrisonJourney
    return this.renderView(req, res)
  }
}
