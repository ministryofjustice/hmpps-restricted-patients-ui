import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class MovePrisonerSelectHospitalPage extends AbstractPage {
  readonly header: Locator

  readonly prisonerName: Locator

  readonly prisonerNumber: Locator

  readonly prisonerCell: Locator

  readonly prisonerAlerts: Locator

  readonly hospital: Locator

  readonly submit: Locator

  readonly cancel: Locator

  private constructor(name: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Move ${name} to a hospital` })
    this.prisonerName = page.getByTestId('prisoner-name')
    this.prisonerNumber = page.getByTestId('prisoner-number')
    this.prisonerCell = page.getByTestId('prisoner-cell-location')
    this.prisonerAlerts = page.getByTestId('prisoner-relevant-alerts')
    this.hospital = page.locator('.autocomplete__input')
    this.submit = page.getByTestId('select-hospital-submit')
    this.cancel = page.getByTestId('select-hospital-cancel')
  }

  static async verifyOnPage(prisonerName: string, page: Page): Promise<MovePrisonerSelectHospitalPage> {
    const movePrisonerSelectHospitalPage = new MovePrisonerSelectHospitalPage(prisonerName, page)
    await expect(movePrisonerSelectHospitalPage.header).toBeVisible()
    return movePrisonerSelectHospitalPage
  }
}
