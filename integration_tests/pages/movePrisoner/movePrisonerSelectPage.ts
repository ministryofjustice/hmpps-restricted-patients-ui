import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class MovePrisonerSelectPage extends AbstractPage {
  readonly header: Locator

  readonly searchTerm: Locator

  readonly submit: Locator

  readonly resultsTable: Locator

  readonly noResultsMessage: Locator

  readonly moveToHospitalLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Select a prisoner to move' })
    this.searchTerm = page.getByTestId('prisoner-search-term-input')
    this.submit = page.getByTestId('prisoner-search-submit')
    this.resultsTable = page.getByTestId('prisoner-search-results-table')
    this.noResultsMessage = page.getByTestId('no-results-message')
    this.moveToHospitalLink = page.getByTestId('prisoner-move-to-hospital-link')
  }

  static async verifyOnPage(page: Page): Promise<MovePrisonerSelectPage> {
    const movePrisonerSelectPage = new MovePrisonerSelectPage(page)
    await expect(movePrisonerSelectPage.header).toBeVisible()
    return movePrisonerSelectPage
  }
}
