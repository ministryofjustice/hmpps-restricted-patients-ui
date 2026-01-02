import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class PatientSearchPage extends AbstractPage {
  readonly header: Locator

  readonly searchTerm: Locator

  readonly submit: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Search for a restricted patient' })
    this.searchTerm = page.getByTestId('patient-search-term-input')
    this.submit = page.getByTestId('patient-search-submit')
  }

  static async verifyOnPage(page: Page): Promise<PatientSearchPage> {
    const patientSearchPage = new PatientSearchPage(page)
    await expect(patientSearchPage.header).toBeVisible()
    return patientSearchPage
  }
}
