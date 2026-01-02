import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class RemoveRestrictedPatientCompletedPage extends AbstractPage {
  readonly header: Locator

  readonly finishButton: Locator

  private constructor(prisonerName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `${prisonerName} has been removed from restricted patients` })
    this.finishButton = page.getByTestId('restricted-patient-removal-completed-finish')
  }

  static async verifyOnPage(prisonerName: string, page: Page): Promise<RemoveRestrictedPatientCompletedPage> {
    const removeRestrictedPatientCompletedPage = new RemoveRestrictedPatientCompletedPage(prisonerName, page)
    await expect(removeRestrictedPatientCompletedPage.header).toBeVisible()
    return removeRestrictedPatientCompletedPage
  }
}
