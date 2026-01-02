import { expect, test } from '@playwright/test'
import manageUsersApi from '../mockApis/manageUsersApi'
import frontendComponents from '../mockApis/frontendComponents'
import { login } from '../testUtils'
import search from '../mockApis/search'
import prisonApi from '../mockApis/prisonApi'
import HomePage from '../pages/homePage'
import restrictedPatientApi from '../mockApis/restrictedPatientApi'
import PatientSearchPage from '../pages/changeSupportingPrison/patientSearchPage'
import PatientSelectPage from '../pages/changeSupportingPrison/patientSelectPage'
import ChangePrisonConfirmationPage from '../pages/changeSupportingPrison/changePrisonConfirmationPage'
import SelectPrisonPage from '../pages/changeSupportingPrison/selectPrisonPage'
import ChangePrisonCompletedPage from '../pages/changeSupportingPrison/changePrisonCompletedPage'

test.describe('Change supporting prison', () => {
  test.beforeEach(async ({ page }) => {
    await manageUsersApi.stubManageUser()
    await frontendComponents.stubFrontendComponents()
    await login(page, { roles: ['ROLE_RESTRICTED_PATIENT_MIGRATION'] })
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
          description: 'HMP Moorland',
          longDescription: 'Moorland (HMP)',
          agencyType: 'INST',
          active: true,
        },
      ],
    })
    await prisonApi.stubGetAgencyDetails({
      id: 'MDI',
      response: {
        agencyId: 'MDI',
        description: 'HMP Moorland',
        longDescription: 'Moorland (HMP)',
        agencyType: 'INST',
        active: true,
      },
    })
    await restrictedPatientApi.stubChangeSupportingPrison({
      status: 200,
      response: {
        restrictedPatient: {
          supportingPrison: 'MDI',
        },
      },
    })
    await prisonApi.stubGetPrisonerDetails({
      prisonerNumber: 'A1234AA',
      response: {
        offenderNo: 'A1234AA',
        firstName: 'JOHN',
        lastName: 'SMITH',
        locationDescription: 'Bartholemew Court',
        categoryCode: 'C',
        alerts: [
          { active: true, alertType: 'T', alertCode: 'TCPA' },
          { active: true, alertType: 'X', alertCode: 'XCU' },
        ],
      },
    })
  })

  test('should display the change supporting prison from the HomePage', async ({ page }) => {
    await HomePage.verifyOnPage(page).then(homePage => homePage.changeSupportingPrison.click())
    await PatientSearchPage.verifyOnPage(page)
  })

  test('Completes a change supporting prison journey', async ({ page }) => {
    await page.goto('/change-supporting-prison/search-for-patient')
    const patientSearchPage = await PatientSearchPage.verifyOnPage(page)

    await patientSearchPage.searchTerm.fill('A1234AA')
    await patientSearchPage.submit.click()

    await expect(page).toHaveURL('/change-supporting-prison/select-patient?searchTerm=A1234AA')

    const patientSelectPage = await PatientSelectPage.verifyOnPage(page)

    const rows = patientSelectPage.resultsTable.getByRole('row')
    await expect(rows).toHaveCount(2) // 1 result plus table header
    const cells = rows.nth(1).getByRole('cell')
    await expect(cells.nth(1)).toHaveText('Smith, John')
    await expect(cells.nth(2)).toHaveText('A1234AA')
    await expect(cells.nth(3)).toHaveText('Sheffield Hospital')
    await expect(cells.nth(4)).toHaveText('HMP Moorland')
    await expect(cells.nth(5)).toContainText('Change supporting prison')
    await patientSelectPage.changeSupportingPrisonLink.click()

    const selectPrisonPage = await SelectPrisonPage.verifyOnPage('John Smith', page)

    await expect(selectPrisonPage.prisonerName).toHaveText('Smith, John')
    await expect(selectPrisonPage.prisonerNumber).toHaveText('A1234AA')
    await expect(selectPrisonPage.prisonerLocation).toHaveText('Sheffield Hospital')
    await expect(selectPrisonPage.prisonerSupportingPrison).toHaveText('HMP Moorland')

    await selectPrisonPage.prison.fill('Moor')
    await page.getByRole('option', { name: 'HMP Moorland' }).click()
    await selectPrisonPage.submit.click()

    const confirmationPage = await ChangePrisonConfirmationPage.verifyOnPage('John Smith', 'HMP Moorland', page)

    await confirmationPage.confirm.click()

    const completedPage = await ChangePrisonCompletedPage.verifyOnPage('John Smith', page)
    await expect(completedPage.informationMessage).toContainText('supporting prison is now HMP Moorland')
    await completedPage.finish.click()

    await expect(page).toHaveURL('/')
  })

  test.describe('Select patient results page', () => {
    test('Displays no results message', async ({ page }) => {
      await search.stubRestrictedPatientSearch({
        query: {
          equalToJson: {
            prisonerIdentifier: 'A1234AA',
            prisonIds: ['OUT'],
            includeAliases: false,
          },
        },
        results: {
          // @ts-expect-error not bothered since stubbing in a test
          content: [],
        },
      })

      await page.goto('/change-supporting-prison/search-for-patient')
      const patientSearchPage = await PatientSearchPage.verifyOnPage(page)

      await patientSearchPage.searchTerm.fill('A1234AA')
      await patientSearchPage.submit.click()

      const patientSelectPage = await PatientSelectPage.verifyOnPage(page)

      await expect(patientSelectPage.resultsTable).toBeHidden()
      await expect(patientSelectPage.noResultsMessage).toHaveText(
        'There are no results for the details you have entered.',
      )
    })

    test('Handles search again validation', async ({ page }) => {
      await page.goto('/change-supporting-prison/search-for-patient')
      const patientSearchPage = await PatientSearchPage.verifyOnPage(page)

      await patientSearchPage.searchTerm.fill('A1234AA')
      await patientSearchPage.submit.click()

      const patientSelectPage = await PatientSelectPage.verifyOnPage(page)

      await patientSelectPage.searchTerm.clear()
      await patientSelectPage.submit.click()

      await expect(patientSelectPage.errorSummary).toHaveText('Enter a restricted patient’s name or prison number')
    })
  })
})
