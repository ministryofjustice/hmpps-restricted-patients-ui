import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from './abstractPage'

export default class ErrorPage extends AbstractPage {
  readonly header: Locator

  readonly continue: Locator

  private constructor(errorMessage: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: errorMessage })
    this.continue = page.getByTestId('continue-after-error')
  }

  static async verifyOnPage(errorMessage: string, page: Page): Promise<ErrorPage> {
    const errorPage = new ErrorPage(errorMessage, page)
    await expect(errorPage.header).toBeVisible()
    return errorPage
  }
}
