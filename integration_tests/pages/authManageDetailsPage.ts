import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from './abstractPage'

export default class AuthManageDetailsPage extends AbstractPage {
  readonly header: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Your account details' })
  }

  static async verifyOnPage(page: Page): Promise<AuthManageDetailsPage> {
    const authManageDetailsPage = new AuthManageDetailsPage(page)
    await expect(authManageDetailsPage.header).toBeVisible()
    return authManageDetailsPage
  }
}
