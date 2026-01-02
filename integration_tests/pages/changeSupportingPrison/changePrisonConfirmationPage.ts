import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class ChangePrisonConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly confirm: Locator

  readonly cancel: Locator

  private constructor(prisonerName: string, prisonName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', {
      hasText: `You are changing ${prisonerName}’s supporting prison to ${prisonName}`,
    })
    this.confirm = page.getByTestId('confirm-patient-change-submit')
    this.cancel = page.getByTestId('confirm-patient-change-cancel')
  }

  static async verifyOnPage(
    prisonerName: string,
    prisonName: string,
    page: Page,
  ): Promise<ChangePrisonConfirmationPage> {
    const changePrisonConfirmationPage = new ChangePrisonConfirmationPage(prisonerName, prisonName, page)
    await expect(changePrisonConfirmationPage.header).toBeVisible()
    return changePrisonConfirmationPage
  }
}
