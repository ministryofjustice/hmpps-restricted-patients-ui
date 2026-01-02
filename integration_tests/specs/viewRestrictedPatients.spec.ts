import { expect, test } from '@playwright/test'
import manageUsersApi from '../mockApis/manageUsersApi'
import frontendComponents from '../mockApis/frontendComponents'
import { resetStubs } from '../mockApis/wiremock'
import { login } from '../testUtils'
import search from '../mockApis/search'
import prisonApi from '../mockApis/prisonApi'
import HomePage from '../pages/homePage'
import RestrictedPatientSearchPage from '../pages/viewRestrictedPatients/restrictedPatientSearchPage'
import ViewRestrictedPatientsPage from '../pages/viewRestrictedPatients/viewRestrictedPatientsPage'

test.describe('View restricted patients', () => {
  test.beforeEach(async ({ page }) => {
    await manageUsersApi.stubManageUser()
    await frontendComponents.stubFrontendComponents()
    await login(page, { roles: ['ROLE_SEARCH_RESTRICTED_PATIENT'] })
    await search.stubRestrictedPatientSearch({
      query: {
        equalToJson: {
          prisonerIdentifier: 'A1234AA',
          prisonIds: [],
          includeAliases: false,
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
            supportingPrisonId: 'DNI',
            dischargedHospitalDescription: 'Hazelwood House',
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
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('should show search restricted patient', async ({ page }) => {
    await HomePage.verifyOnPage(page).then(homePage => homePage.searchRestrictedPatient.click())
    await RestrictedPatientSearchPage.verifyOnPage(page)
  })

  test('Shows Restricted Patients', async ({ page }) => {
    await HomePage.verifyOnPage(page).then(homePage => homePage.searchRestrictedPatient.click())
    const restrictedPatientSearchPage = await RestrictedPatientSearchPage.verifyOnPage(page)

    await restrictedPatientSearchPage.searchTerm.fill('A1234AA')
    await restrictedPatientSearchPage.submit.click()

    await expect(page).toHaveURL('/view-restricted-patients?searchTerm=A1234AA')

    const viewRestrictedPatientsPage = await ViewRestrictedPatientsPage.verifyOnPage(page)

    const rows = viewRestrictedPatientsPage.resultsTable.getByRole('row')
    await expect(rows).toHaveCount(2) // 1 result plus table header
    const cells = rows.nth(1).getByRole('cell')
    await expect(cells.nth(1)).toHaveText('Smith, John')
    await expect(cells.nth(2)).toHaveText('A1234AA')
    await expect(cells.nth(3)).toHaveText('Hazelwood House')
    await expect(cells.nth(4)).toHaveText('Doncaster')
    await expect(cells.nth(5)).toContainText('Add a case note')

    await expect(viewRestrictedPatientsPage.viewPrisonerProfile).toHaveAttribute('href', /\/prisoner\/A1234AA/)
    await expect(viewRestrictedPatientsPage.addCaseNotes).toHaveAttribute('href', /\/prisoner\/A1234AA\/add-case-note/)
  })

  test.describe('View restricted patients results page', () => {
    test('Displays no results message', async ({ page }) => {
      await search.stubRestrictedPatientSearch({
        results: {
          // @ts-expect-error not bothered since stubbing in a test
          content: [],
        },
      })

      await page.goto('/view-restricted-patients/search-for-patient')
      const restrictedPatientSearchPage = await RestrictedPatientSearchPage.verifyOnPage(page)

      await restrictedPatientSearchPage.searchTerm.fill('A1234AA')
      await restrictedPatientSearchPage.submit.click()

      const viewRestrictedPatientsPage = await ViewRestrictedPatientsPage.verifyOnPage(page)

      await expect(viewRestrictedPatientsPage.resultsTable).toBeHidden()
      await expect(viewRestrictedPatientsPage.noResultsMessage).toHaveText(
        'There are no results for the details you have entered.',
      )
    })

    test('Handles search again validation', async ({ page }) => {
      await search.stubRestrictedPatientSearch({
        results: {
          // @ts-expect-error not bothered since stubbing in a test
          content: [],
        },
      })

      await page.goto('/view-restricted-patients/search-for-patient')
      const restrictedPatientSearchPage = await RestrictedPatientSearchPage.verifyOnPage(page)

      await restrictedPatientSearchPage.searchTerm.fill('A1234AA')
      await restrictedPatientSearchPage.submit.click()

      const viewRestrictedPatientsPage = await ViewRestrictedPatientsPage.verifyOnPage(page)

      await viewRestrictedPatientsPage.searchTerm.clear()
      await viewRestrictedPatientsPage.submit.click()

      await expect(viewRestrictedPatientsPage.errorSummary).toHaveText(
        'Enter a restricted patient’s name or prison number',
      )
    })
  })
})
