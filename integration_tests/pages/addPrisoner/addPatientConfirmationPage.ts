import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class AddPatientConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly confirm: Locator

  readonly cancel: Locator

  private constructor(prisonerName: string, hospitalName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `You are adding ${prisonerName} to ${hospitalName}` })
    this.confirm = page.getByTestId('confirm-prisoner-add-submit')
    this.cancel = page.getByTestId('confirm-prisoner-add-cancel')
  }

  static async verifyOnPage(
    prisonerName: string,
    hospitalName: string,
    page: Page,
  ): Promise<AddPatientConfirmationPage> {
    const addPatientConfirmationPage = new AddPatientConfirmationPage(prisonerName, hospitalName, page)
    await expect(addPatientConfirmationPage.header).toBeVisible()
    return addPatientConfirmationPage
  }
}
