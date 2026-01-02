import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from './abstractPage'

export default class AuthErrorPage extends AbstractPage {
  readonly header: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Authorisation Error' })
  }

  static async verifyOnPage(page: Page): Promise<AuthErrorPage> {
    const authErrorPage = new AuthErrorPage(page)
    await expect(authErrorPage.header).toBeVisible()
    return authErrorPage
  }
}
