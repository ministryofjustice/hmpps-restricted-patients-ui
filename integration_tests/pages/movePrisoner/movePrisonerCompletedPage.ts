import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class MovePrisonerCompletedPage extends AbstractPage {
  readonly header: Locator

  readonly informationMessage: Locator

  readonly finish: Locator

  private constructor(prisonerName: string, hospitalName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `${prisonerName} has been moved to ${hospitalName}` })
    this.informationMessage = page.getByTestId('prisoner-move-completed-help-text')
    this.finish = page.getByTestId('prisoner-move-completed-finish')
  }

  static async verifyOnPage(
    prisonerName: string,
    hospitalName: string,
    page: Page,
  ): Promise<MovePrisonerCompletedPage> {
    const movePrisonerCompletedPage = new MovePrisonerCompletedPage(prisonerName, hospitalName, page)
    await expect(movePrisonerCompletedPage.header).toBeVisible()
    return movePrisonerCompletedPage
  }
}
