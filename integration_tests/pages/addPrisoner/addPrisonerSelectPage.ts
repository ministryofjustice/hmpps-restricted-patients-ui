import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class AddPrisonerSelectPage extends AbstractPage {
  readonly header: Locator

  readonly searchTerm: Locator

  readonly submit: Locator

  readonly resultsTable: Locator

  readonly noResultsMessage: Locator

  readonly addRestrictedPatientLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Select a prisoner to add' })

    this.searchTerm = page.getByTestId('prisoner-search-term-input')

    this.submit = page.getByTestId('prisoner-search-submit')

    this.resultsTable = page.getByTestId('prisoner-search-results-table')

    this.noResultsMessage = page.getByTestId('no-results-message')

    this.addRestrictedPatientLink = page.getByTestId('prisoner-add-restricted-patient-link')
  }

  static async verifyOnPage(page: Page): Promise<AddPrisonerSelectPage> {
    const addPrisonerSelectPage = new AddPrisonerSelectPage(page)
    await expect(addPrisonerSelectPage.header).toBeVisible()
    return addPrisonerSelectPage
  }
}
