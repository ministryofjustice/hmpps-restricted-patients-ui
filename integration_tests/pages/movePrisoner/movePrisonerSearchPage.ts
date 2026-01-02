import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class MovePrisonerSearchPage extends AbstractPage {
  readonly header: Locator

  readonly searchTerm: Locator

  readonly submit: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Search for a prisoner to move' })
    this.searchTerm = page.getByTestId('prisoner-search-term-input')
    this.submit = page.getByTestId('prisoner-search-submit')
  }

  static async verifyOnPage(page: Page): Promise<MovePrisonerSearchPage> {
    const movePrisonerSearchPage = new MovePrisonerSearchPage(page)
    await expect(movePrisonerSearchPage.header).toBeVisible()
    return movePrisonerSearchPage
  }
}
