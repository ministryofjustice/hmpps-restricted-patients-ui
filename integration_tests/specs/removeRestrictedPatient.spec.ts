import { expect, test } from '@playwright/test'
import manageUsersApi from '../mockApis/manageUsersApi'
import frontendComponents from '../mockApis/frontendComponents'
import { login } from '../testUtils'
import search from '../mockApis/search'
import prisonApi from '../mockApis/prisonApi'
import HomePage from '../pages/homePage'
import restrictedPatientApi from '../mockApis/restrictedPatientApi'
import RemoveRestrictedPatientSearchPage from '../pages/removeRestrictedPatient/removeRestrictedPatientSearchPage'
import RemoveRestrictedPatientSelectPage from '../pages/removeRestrictedPatient/removeRestrictedPatientSelectPage'
import RemoveRestrictedPatientConfirmationPage from '../pages/removeRestrictedPatient/removeRestrictedPatientConfirmationPage'
import RemoveRestrictedPatientCompletedPage from '../pages/removeRestrictedPatient/removeRestrictedPatientCompletedPage'

test.describe('Remove restricted patient', () => {
  test.beforeEach(async ({ page }) => {
    await manageUsersApi.stubManageUser()
    await frontendComponents.stubFrontendComponents()
    await login(page, { roles: ['ROLE_REMOVE_RESTRICTED_PATIENT'] })
    await search.stubRestrictedPatientSearch({
      query: {
        // @ts-expect-error not bothered since stubbing in a test
        equalToJson: {
          prisonerIdentifier: 'A1234AA',
        },
      },
      results: {
        // @ts-expect-error not bothered since stubbing in a test
        content: [
          {
            cellLocation: '1-2-015',
            firstName: 'JOHN',
            lastName: 'SMITH',
            prisonerNumber: 'A1234AA',
            supportingPrisonId: 'MDI',
            dischargedHospitalDescription: 'Sheffield Hospital',
          },
        ],
      },
    })
    // @ts-expect-error not bothered since stubbing in a test
    await prisonApi.stubGetAgenciesByType({
      type: 'INST',
      response: [
        {
          agencyId: 'MDI',
          description: 'Moorland',
          longDescription: 'HMP Moorland',
          agencyType: 'INST',
          active: true,
        },
        {
          agencyId: 'DNI',
          description: 'Doncaster',
          longDescription: 'HMP Doncaster',
          agencyType: 'INST',
          active: true,
        },
      ],
    })
    await prisonApi.stubGetPrisonerDetails({
      prisonerNumber: 'A1234AA',
      response: {
        offenderNo: 'A1234AA',
        firstName: 'JOHN',
        lastName: 'SMITH',
        assignedLivingUnit: { description: '1-2-015' },
        categoryCode: 'C',
        alerts: [
          { alertType: 'T', alertCode: 'TCPA' },
          { alertType: 'X', alertCode: 'XCU' },
        ],
      },
    })
    // @ts-expect-error not bothered since stubbing in a test
    await restrictedPatientApi.stubGetPatient({
      prisonerNumber: 'A1234AA',
      response: {
        hospitalLocation: {
          description: 'Sheffield Hospital',
        },
      },
    })
    // @ts-expect-error not bothered since stubbing in a test
    await restrictedPatientApi.stubRemovePatient({ prisonerNumber: 'A1234AA' })
  })

  test('should display the search for patient page from the HomePage', async ({ page }) => {
    await HomePage.verifyOnPage(page).then(homePage => homePage.removeFromRestrictedPatients.click())
    await RemoveRestrictedPatientSearchPage.verifyOnPage(page)
  })

  test('Progresses through the removal of a restricted patient journey', async ({ page }) => {
    await page.goto('/remove-from-restricted-patients/search-for-patient')
    const restrictedPatientSearchPage = await RemoveRestrictedPatientSearchPage.verifyOnPage(page)

    await restrictedPatientSearchPage.searchTerm.fill('A1234AA')
    await restrictedPatientSearchPage.submit.click()

    await expect(page).toHaveURL('/remove-from-restricted-patients/select-patient?searchTerm=A1234AA')

    const restrictedPatientSelectPage = await RemoveRestrictedPatientSelectPage.verifyOnPage(page)

    const rows = restrictedPatientSelectPage.resultsTable.getByRole('row')
    await expect(rows).toHaveCount(2) // 1 result plus table header
    const cells = rows.nth(1).getByRole('cell')
    await expect(cells.nth(1)).toHaveText('Smith, John')
    await expect(cells.nth(2)).toHaveText('A1234AA')
    await expect(cells.nth(3)).toHaveText('Sheffield Hospital')
    await expect(cells.nth(4)).toContainText('Remove as a restricted patient')

    await expect(restrictedPatientSelectPage.viewPrisonerProfile).toHaveAttribute('href', /\/prisoner\/A1234AA/)
    await expect(restrictedPatientSelectPage.removeRestrictedPatientLink).toHaveAttribute(
      'href',
      /\/remove-from-restricted-patients\?prisonerNumber=A1234AA/,
    )
    await restrictedPatientSelectPage.removeRestrictedPatientLink.click()

    const removeRestrictedPatientConfirmationPage = await RemoveRestrictedPatientConfirmationPage.verifyOnPage(
      'John Smith',
      page,
    )

    await expect(removeRestrictedPatientConfirmationPage.patientName).toHaveText('Smith, John')
    await expect(removeRestrictedPatientConfirmationPage.prisonerNumber).toHaveText('A1234AA')
    await expect(removeRestrictedPatientConfirmationPage.patientHospital).toHaveText('Sheffield Hospital')

    await removeRestrictedPatientConfirmationPage.confirmRemoval.click()

    const removeRestrictedPatientCompletedPage = await RemoveRestrictedPatientCompletedPage.verifyOnPage(
      'John Smith',
      page,
    )

    await removeRestrictedPatientCompletedPage.finishButton.click()

    await expect(page).toHaveURL('/')
  })

  test('Cancel the progress through the removal of a restricted patient journey', async ({ page }) => {
    await page.goto('/remove-from-restricted-patients/search-for-patient')
    const restrictedPatientSearchPage = await RemoveRestrictedPatientSearchPage.verifyOnPage(page)

    await restrictedPatientSearchPage.searchTerm.fill('A1234AA')
    await restrictedPatientSearchPage.submit.click()
    const restrictedPatientSelectPage = await RemoveRestrictedPatientSelectPage.verifyOnPage(page)
    await restrictedPatientSelectPage.removeRestrictedPatientLink.click()
    const removeRestrictedPatientConfirmationPage = await RemoveRestrictedPatientConfirmationPage.verifyOnPage(
      'John Smith',
      page,
    )
    await removeRestrictedPatientConfirmationPage.cancelRemoval.click()

    const restrictedPatientSelectPage2 = await RemoveRestrictedPatientSelectPage.verifyOnPage(page)
    await expect(restrictedPatientSelectPage2.searchTerm).toHaveValue('A1234AA')
  })

  test('Handles search form validation', async ({ page }) => {
    await page.goto('/remove-from-restricted-patients/search-for-patient')
    const restrictedPatientSearchPage = await RemoveRestrictedPatientSearchPage.verifyOnPage(page)

    await restrictedPatientSearchPage.submit.click()

    await expect(restrictedPatientSearchPage.errorSummary).toHaveText(
      'Enter a restricted patient’s name or prison number',
    )
  })

  test.describe('View restricted patients results page', () => {
    test('Displays no results message', async ({ page }) => {
      await search.stubRestrictedPatientSearch({
        results: {
          // @ts-expect-error not bothered since stubbing in a test
          content: [],
        },
      })

      await page.goto('/remove-from-restricted-patients/search-for-patient')
      const restrictedPatientSearchPage = await RemoveRestrictedPatientSearchPage.verifyOnPage(page)

      await restrictedPatientSearchPage.searchTerm.fill('A1234AA')
      await restrictedPatientSearchPage.submit.click()

      const restrictedPatientSelectPage = await RemoveRestrictedPatientSelectPage.verifyOnPage(page)

      await expect(restrictedPatientSelectPage.resultsTable).toBeHidden()
      await expect(restrictedPatientSelectPage.noResultsMessage).toHaveText(
        'There are no results for the details you have entered.',
      )
    })

    test('Handles search again', async ({ page }) => {
      await page.goto('/remove-from-restricted-patients/search-for-patient')
      const restrictedPatientSearchPage = await RemoveRestrictedPatientSearchPage.verifyOnPage(page)

      await restrictedPatientSearchPage.searchTerm.fill('A1234AA')
      await restrictedPatientSearchPage.submit.click()

      const restrictedPatientSelectPage = await RemoveRestrictedPatientSelectPage.verifyOnPage(page)

      await restrictedPatientSelectPage.searchTerm.clear()
      await restrictedPatientSelectPage.submit.click()

      await expect(restrictedPatientSelectPage.errorSummary).toHaveText(
        'Enter a restricted patient’s name or prison number',
      )

      await restrictedPatientSelectPage.searchTerm.fill('A1234AA')
      await restrictedPatientSelectPage.submit.click()

      const rows = restrictedPatientSelectPage.resultsTable.getByRole('row')
      await expect(rows).toHaveCount(2)
      const cells = rows.nth(1).getByRole('cell')
      await expect(cells.nth(1)).toHaveText('Smith, John')
    })
  })

  test('Handles empty search from select', async ({ page }) => {
    await page.goto('/remove-from-restricted-patients/select-patient')
    await RemoveRestrictedPatientSearchPage.verifyOnPage(page)
  })
})
