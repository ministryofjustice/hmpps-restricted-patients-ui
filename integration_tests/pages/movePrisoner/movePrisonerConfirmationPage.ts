import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class MovePrisonerConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly cancel: Locator

  readonly confirm: Locator

  private constructor(prisonerName: string, hospitalName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `You are moving ${prisonerName} to ${hospitalName}` })
    this.confirm = page.getByTestId('confirm-prisoner-move-submit')
    this.cancel = page.getByTestId('confirm-prisoner-move-cancel')
  }

  static async verifyOnPage(
    prisonerName: string,
    hospitalName: string,
    page: Page,
  ): Promise<MovePrisonerConfirmationPage> {
    const movePrisonerConfirmation = new MovePrisonerConfirmationPage(prisonerName, hospitalName, page)
    await expect(movePrisonerConfirmation.header).toBeVisible()
    return movePrisonerConfirmation
  }
}
