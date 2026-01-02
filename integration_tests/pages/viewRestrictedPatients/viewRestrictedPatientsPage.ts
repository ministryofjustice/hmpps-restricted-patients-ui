import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class ViewRestrictedPatientsPage extends AbstractPage {
  readonly header: Locator

  readonly searchTerm: Locator

  readonly submit: Locator

  readonly resultsTable: Locator

  readonly noResultsMessage: Locator

  readonly viewPrisonerProfile: Locator

  readonly addCaseNotes: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Restricted patients' })
    this.searchTerm = page.getByTestId('patient-search-term-input')
    this.submit = page.getByTestId('patient-search-submit')
    this.resultsTable = page.getByTestId('patient-search-results-table')
    this.noResultsMessage = page.getByTestId('no-results-message')
    this.viewPrisonerProfile = page.getByTestId('view-prisoner-profile')
    this.addCaseNotes = page.getByTestId('patient-add-case-note-link')
  }

  static async verifyOnPage(page: Page): Promise<ViewRestrictedPatientsPage> {
    const viewRestrictedPatients = new ViewRestrictedPatientsPage(page)
    await expect(viewRestrictedPatients.header).toBeVisible()
    return viewRestrictedPatients
  }
}
