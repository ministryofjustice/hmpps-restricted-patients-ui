import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class RemoveRestrictedPatientSelectPage extends AbstractPage {
  readonly header: Locator

  readonly searchTerm: Locator

  readonly submit: Locator

  readonly resultsTable: Locator

  readonly noResultsMessage: Locator

  readonly viewPrisonerProfile: Locator

  readonly removeRestrictedPatientLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Select a restricted patient' })
    this.searchTerm = page.getByTestId('patient-search-term-input')
    this.submit = page.getByTestId('patient-search-submit')
    this.resultsTable = page.getByTestId('patient-search-results-table')
    this.noResultsMessage = page.getByTestId('no-results-message')
    this.viewPrisonerProfile = page.getByTestId('view-prisoner-profile')
    this.removeRestrictedPatientLink = page.getByTestId('remove-restricted-patient-link')
  }

  static async verifyOnPage(page: Page): Promise<RemoveRestrictedPatientSelectPage> {
    const authErrorPage = new RemoveRestrictedPatientSelectPage(page)
    await expect(authErrorPage.header).toBeVisible()
    return authErrorPage
  }
}
