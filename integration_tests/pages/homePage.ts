import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from './abstractPage'

export default class HomePage extends AbstractPage {
  readonly header: Locator

  readonly searchRestrictedPatient: Locator

  readonly moveToHospital: Locator

  readonly addRestrictedPatient: Locator

  readonly removeFromRestrictedPatients: Locator

  readonly changeSupportingPrison: Locator

  readonly helpLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: 'Manage restricted patients' })
    this.searchRestrictedPatient = page.getByTestId('search-restricted-patient')
    this.moveToHospital = page.getByTestId('move-to-hospital')
    this.addRestrictedPatient = page.getByTestId('add-restricted-patient')
    this.removeFromRestrictedPatients = page.getByTestId('remove-from-restricted-patients')
    this.changeSupportingPrison = page.getByTestId('change-supporting-patient')
    this.helpLink = page.getByTestId('help')
  }

  static async verifyOnPage(page: Page): Promise<HomePage> {
    const homePage = new HomePage(page)
    await expect(homePage.header).toBeVisible()
    return homePage
  }
}
