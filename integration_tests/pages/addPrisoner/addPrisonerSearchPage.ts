import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class AddPrisonerSearchPage extends AbstractPage {
  readonly header: Locator

  readonly searchTerm: Locator

  readonly submit: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Search for a prisoner to add' })
    this.searchTerm = page.getByTestId('prisoner-search-term-input')
    this.submit = page.getByTestId('prisoner-search-submit')
  }

  static async verifyOnPage(page: Page): Promise<AddPrisonerSearchPage> {
    const addPrisonerSearchPage = new AddPrisonerSearchPage(page)
    await expect(addPrisonerSearchPage.header).toBeVisible()
    return addPrisonerSearchPage
  }
}
