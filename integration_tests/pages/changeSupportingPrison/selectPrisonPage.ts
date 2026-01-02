import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class SelectPrisonPage extends AbstractPage {
  readonly header: Locator

  readonly prisonerName: Locator

  readonly prisonerNumber: Locator

  readonly prisonerLocation: Locator

  readonly prisonerSupportingPrison: Locator

  readonly prison: Locator

  readonly cancel: Locator

  readonly submit: Locator

  private constructor(hospitalName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `Select a supporting prison for ${hospitalName}` })
    this.prisonerName = page.getByTestId('prisoner-name')
    this.prisonerNumber = page.getByTestId('prisoner-number')
    this.prisonerLocation = page.getByTestId('prisoner-location')
    this.prisonerSupportingPrison = page.getByTestId('prisoner-supporting-prison')
    this.prison = page.locator('.autocomplete__input')
    this.submit = page.getByTestId('select-prison-submit')
    this.cancel = page.getByTestId('select-prison-cancel')
  }

  static async verifyOnPage(hospitalName: string, page: Page): Promise<SelectPrisonPage> {
    const selectPrisonPage = new SelectPrisonPage(hospitalName, page)
    await expect(selectPrisonPage.header).toBeVisible()
    return selectPrisonPage
  }
}
