import { expect, type Locator, type Page } from '@playwright/test'

import AbstractPage from '../abstractPage'

export default class RemoveRestrictedPatientConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly patientName: Locator

  readonly prisonerNumber: Locator

  readonly patientHospital: Locator

  readonly confirmRemoval: Locator

  readonly cancelRemoval: Locator

  private constructor(prisonerName: string, page: Page) {
    super(page)
    this.header = page.locator('h1', { hasText: `You are removing ${prisonerName} from restricted patients` })
    this.patientName = page.getByTestId('patient-name')
    this.prisonerNumber = page.getByTestId('prisoner-number')
    this.patientHospital = page.getByTestId('patient-hospital')
    this.confirmRemoval = page.getByTestId('confirm-patient-removal-submit')
    this.cancelRemoval = page.getByTestId('confirm-patient-removal-cancel')
  }

  static async verifyOnPage(prisonerName: string, page: Page): Promise<RemoveRestrictedPatientConfirmationPage> {
    const removeRestrictedPatientConfirmation = new RemoveRestrictedPatientConfirmationPage(prisonerName, page)
    await expect(removeRestrictedPatientConfirmation.header).toBeVisible()
    return removeRestrictedPatientConfirmation
  }
}
