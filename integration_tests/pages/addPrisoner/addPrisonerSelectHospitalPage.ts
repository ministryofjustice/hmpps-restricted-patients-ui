import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class AddPrisonerSelectHospitalPage extends AbstractPage {
  readonly header: Locator

  readonly prisonerName: Locator

  readonly prisonerNumber: Locator

  readonly prisonerLocation: Locator

  readonly prisonerAlerts: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly hospital: Locator

  private constructor(hospitalName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Select a hospital for ${hospitalName}` })
    this.prisonerName = page.getByTestId('prisoner-name')

    this.prisonerNumber = page.getByTestId('prisoner-number')

    this.prisonerLocation = page.getByTestId('prisoner-location')

    this.prisonerAlerts = page.getByTestId('prisoner-relevant-alerts')

    this.hospital = page.locator('.autocomplete__input')

    this.submit = page.getByTestId('select-hospital-submit')

    this.cancel = page.getByTestId('select-hospital-cancel')
  }

  static async verifyOnPage(hospitalName: string, page: Page): Promise<AddPrisonerSelectHospitalPage> {
    const addPrisonerSelectHospitalPage = new AddPrisonerSelectHospitalPage(hospitalName, page)
    await expect(addPrisonerSelectHospitalPage.header).toBeVisible()
    return addPrisonerSelectHospitalPage
  }
}
