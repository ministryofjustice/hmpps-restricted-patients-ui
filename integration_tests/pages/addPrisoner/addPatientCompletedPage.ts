import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class AddPatientCompletedPage extends AbstractPage {
  readonly header: Locator

  readonly informationMessage: Locator

  readonly finish: Locator

  private constructor(prisonerName: string, hospitalName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `${prisonerName} has been added to ${hospitalName}` })

    this.informationMessage = page.getByTestId('prisoner-add-completed-help-text')

    this.finish = page.getByTestId('prisoner-add-completed-finish')
  }

  static async verifyOnPage(prisonerName: string, hospitalName: string, page: Page): Promise<AddPatientCompletedPage> {
    const addPatientCompletedPage = new AddPatientCompletedPage(prisonerName, hospitalName, page)
    await expect(addPatientCompletedPage.header).toBeVisible()
    return addPatientCompletedPage
  }
}
