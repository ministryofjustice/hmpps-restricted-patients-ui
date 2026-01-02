import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class RemoveRestrictedPatientSearchPage extends AbstractPage {
  readonly header: Locator

  readonly searchTerm: Locator

  readonly submit: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Search for a restricted patient' })
    this.searchTerm = page.getByTestId('patient-search-term-input')
    this.submit = page.getByTestId('patient-search-submit')
  }

  static async verifyOnPage(page: Page): Promise<RemoveRestrictedPatientSearchPage> {
    const authErrorPage = new RemoveRestrictedPatientSearchPage(page)
    await expect(authErrorPage.header).toBeVisible()
    return authErrorPage
  }
}
