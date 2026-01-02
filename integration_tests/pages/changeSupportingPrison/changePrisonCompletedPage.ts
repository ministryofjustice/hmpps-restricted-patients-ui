import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class ChangePrisonCompletedPage extends AbstractPage {
  readonly header: Locator

  readonly informationMessage: Locator

  readonly finish: Locator

  private constructor(prisonerName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `The supporting prison for ${prisonerName} has been changed` })
    this.informationMessage = page.getByTestId('patient-change-completed-help-text')
    this.finish = page.getByTestId('patient-change-completed-finish')
  }

  static async verifyOnPage(prisonerName: string, page: Page): Promise<ChangePrisonCompletedPage> {
    const changePrisonCompletedPage = new ChangePrisonCompletedPage(prisonerName, page)
    await expect(changePrisonCompletedPage.header).toBeVisible()
    return changePrisonCompletedPage
  }
}
