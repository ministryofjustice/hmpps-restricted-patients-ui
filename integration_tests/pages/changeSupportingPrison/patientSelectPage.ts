import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class PatientSelectPage extends AbstractPage {
  readonly header: Locator

  readonly searchTerm: Locator

  readonly submit: Locator

  readonly resultsTable: Locator

  readonly noResultsMessage: Locator

  readonly changeSupportingPrisonLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Select a restricted patient to change' })
    this.searchTerm = page.getByTestId('patient-search-term-input')
    this.submit = page.getByTestId('patient-search-submit')
    this.resultsTable = page.getByTestId('patient-search-results-table')
    this.noResultsMessage = page.getByTestId('no-results-message')
    this.changeSupportingPrisonLink = page.getByTestId('change-supporting-prison-link')
  }

  static async verifyOnPage(page: Page): Promise<PatientSelectPage> {
    const patientSelectPage = new PatientSelectPage(page)
    await expect(patientSelectPage.header).toBeVisible()
    return patientSelectPage
  }
}
