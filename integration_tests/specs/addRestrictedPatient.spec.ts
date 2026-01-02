import { expect, test } from '@playwright/test'
import manageUsersApi from '../mockApis/manageUsersApi'
import frontendComponents from '../mockApis/frontendComponents'
import { login } from '../testUtils'
import search from '../mockApis/search'
import prisonApi from '../mockApis/prisonApi'
import HomePage from '../pages/homePage'
import restrictedPatientApi from '../mockApis/restrictedPatientApi'
import AddPrisonerSearchPage from '../pages/addPrisoner/addPrisonerSearchPage'
import AddPrisonerSelectPage from '../pages/addPrisoner/addPrisonerSelectPage'
import AddPrisonerSelectHospitalPage from '../pages/addPrisoner/addPrisonerSelectHospitalPage'
import AddPatientConfirmationPage from '../pages/addPrisoner/addPatientConfirmationPage'
import AddPatientCompletedPage from '../pages/addPrisoner/addPatientCompletedPage'

test.describe('Add prisoner', () => {
  test.beforeEach(async ({ page }) => {
    await manageUsersApi.stubManageUser()
    await frontendComponents.stubFrontendComponents()
    await login(page, { roles: ['ROLE_RESTRICTED_PATIENT_MIGRATION'] })
    // @ts-expect-error not bothered since stubbing in a test
    await search.stubSearch({
      query: {
        equalToJson: {
          prisonerIdentifier: 'A1234AA',
          prisonIds: ['OUT'],
          includeAliases: false,
        },
      },
    })
    // @ts-expect-error not bothered since stubbing in a test
    await prisonApi.stubGetAgenciesByType({
      type: 'HOSPITAL',
      response: [
        {
          agencyId: 'SHEFF',
          description: 'Sheffield Hospital',
          longDescription: 'Sheffield Teaching Hospital',
          agencyType: 'HOSP',
          active: true,
        },
      ],
    })
    // @ts-expect-error not bothered since stubbing in a test
    await prisonApi.stubGetAgenciesByType({
      type: 'HSHOSP',
      response: [
        {
          agencyId: 'ROTH',
          description: 'Rotherham Hospital',
          longDescription: 'Rotherham General Hospital',
          agencyType: 'HSHOSP',
          active: true,
        },
      ],
    })
    await prisonApi.stubGetAgencyDetails({
      id: 'SHEFF',
      response: {
        agencyId: 'SHEFF',
        description: 'Sheffield Hospital',
        longDescription: 'Sheffield Teaching Hospital',
        agencyType: 'HOSP',
        active: true,
      },
    })
    await restrictedPatientApi.stubMigrateToHospital({
      status: 200,
      response: {
        restrictivePatient: {
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
        locationDescription: 'Outside - released from Doncaster',
        categoryCode: 'C',
        alerts: [
          { active: true, alertType: 'T', alertCode: 'TCPA' },
          { active: true, alertType: 'X', alertCode: 'XCU' },
        ],
      },
    })
  })

  test('should display the search for prisoner page from the HomePage', async ({ page }) => {
    await HomePage.verifyOnPage(page).then(homePage => homePage.addRestrictedPatient.click())
    await AddPrisonerSearchPage.verifyOnPage(page)
  })

  test('Completes a add prisoner journey', async ({ page }) => {
    await page.goto('/add-restricted-patient/search-for-prisoner')
    const prisonerSearchPage = await AddPrisonerSearchPage.verifyOnPage(page)

    await prisonerSearchPage.searchTerm.fill('A1234AA')
    await prisonerSearchPage.submit.click()

    expect(page.url()).toContain('/add-restricted-patient/select-prisoner?searchTerm=A1234AA')

    const prisonerSelectPage = await AddPrisonerSelectPage.verifyOnPage(page)

    const rows = prisonerSelectPage.resultsTable.getByRole('row')
    await expect(rows).toHaveCount(2) // 1 result plus table header
    const cells = rows.nth(1).getByRole('cell')

    await expect(cells.nth(1)).toHaveText('Smith, John')
    await expect(cells.nth(2)).toHaveText('A1234AA')
    await expect(cells.nth(3)).toHaveText('Outside - released from Doncaster')
    await expect(cells.nth(4)).toHaveText('Controlled unlock')
    await expect(cells.nth(5)).toContainText('Add to restricted patients')

    await prisonerSelectPage.addRestrictedPatientLink.click()

    const selectHospitalPage = await AddPrisonerSelectHospitalPage.verifyOnPage('John Smith', page)

    await expect(selectHospitalPage.prisonerName).toHaveText('Smith, John')
    await expect(selectHospitalPage.prisonerNumber).toHaveText('A1234AA')
    await expect(selectHospitalPage.prisonerLocation).toHaveText('Outside - released from Doncaster')
    await expect(selectHospitalPage.prisonerAlerts).toHaveText('Controlled unlock')

    await selectHospitalPage.hospital.fill('Sheff')
    await page.getByRole('option', { name: 'Sheffield Hospital' }).click()
    await selectHospitalPage.submit.click()

    const addPatientConfirmationRoutes = await AddPatientConfirmationPage.verifyOnPage(
      'John Smith',
      'Sheffield Hospital',
      page,
    )

    await addPatientConfirmationRoutes.confirm.click()

    const addPatientCompletedPage = await AddPatientCompletedPage.verifyOnPage('John Smith', 'Sheffield Hospital', page)

    await addPatientCompletedPage.finish.click()
    expect(page.url()).toEqual('http://localhost:3007/')
  })

  test.describe('Select prisoner results page', () => {
    test('Displays no results message', async ({ page }) => {
      await search.stubSearch({
        query: {
          equalToJson: {
            prisonerIdentifier: 'A1234AA',
            prisonIds: ['OUT'],
            includeAliases: false,
          },
        },
        results: [],
      })

      await page.goto('/add-restricted-patient/search-for-prisoner')
      const prisonerSearchPage = await AddPrisonerSearchPage.verifyOnPage(page)

      await prisonerSearchPage.searchTerm.fill('A1234AA')
      await prisonerSearchPage.submit.click()

      const prisonerSelectPage = await AddPrisonerSelectPage.verifyOnPage(page)

      await expect(prisonerSelectPage.resultsTable).toBeHidden()
      await expect(prisonerSelectPage.noResultsMessage).toHaveText(
        'There are no results for the details you have entered.',
      )
    })

    test('Handles search again validation', async ({ page }) => {
      await page.goto('/add-restricted-patient/search-for-prisoner')
      const prisonerSearchPage = await AddPrisonerSearchPage.verifyOnPage(page)

      await prisonerSearchPage.searchTerm.fill('A1234AA')
      await prisonerSearchPage.submit.click()

      const prisonerSelectPage = await AddPrisonerSelectPage.verifyOnPage(page)

      await prisonerSelectPage.searchTerm.clear()
      await prisonerSelectPage.submit.click()

      await expect(prisonerSelectPage.errorSummary).toHaveText('Enter a prisoner’s name or number')
    })
  })
})
