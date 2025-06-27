import { Request, Response } from 'express'
import { FormError } from '../../@types/template'
import validateMovePrisonerForm from './hospitalSelectValidation'
import PrisonerSearchService from '../../services/prisonerSearchService'
import { addSelect } from '../../utils/utils'
import AgencySearchService from '../../services/agencySearchService'

type PageData = {
  error?: FormError
}

export default abstract class HospitalSelectRoutes {
  protected constructor(
    private readonly agencySearchService: AgencySearchService,
    private readonly prisonerSearchService: PrisonerSearchService,
    private readonly path: string,
    private readonly page: string,
  ) {}

  private renderView = async (req: Request, res: Response, pageData: PageData): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const { user } = res.locals
    const { error } = pageData

    const [hospitals, prisoner] = await Promise.all([
      this.agencySearchService.getHospitals(user),
      this.prisonerSearchService.getPrisonerDetails(prisonerNumber, user),
    ])

    const formattedHospitals = addSelect(
      hospitals.map(hospital => ({
        value: hospital.agencyId,
        text: hospital.description,
      })),
      'Select a hospital',
    )

    return res.render(this.page, {
      errors: error ? [error] : [],
      prisoner,
      formattedHospitals,
    })
  }

  view = async (req: Request, res: Response): Promise<void> => this.renderView(req, res, {})

  submit = async (req: Request, res: Response): Promise<void> => {
    const prisonerNumber = req.query.prisonerNumber as string
    const { hospital } = req.body || {}

    const error = validateMovePrisonerForm({ hospital })

    if (error) return this.renderView(req, res, { error })

    this.startNewJourneyInSession(req)

    return res.redirect(`${this.path}?${new URLSearchParams({ prisonerNumber, hospitalId: hospital })}`)
  }

  protected abstract startNewJourneyInSession(req: Request): void
}
