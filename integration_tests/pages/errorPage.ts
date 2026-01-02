import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from './abstractPage'

export default class ErrorPage extends AbstractPage {
  readonly header: Locator

  private constructor(errorMessage: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: errorMessage })
  }

  static async verifyOnPage(errorMessage: string, page: Page): Promise<ErrorPage> {
    const errorPage = new ErrorPage(errorMessage, page)
    await expect(errorPage.header).toBeVisible()
    return errorPage
  }

  // continue = (): PageElement => cy.get('[data-test="continue-after-error"]')
}
