import { expect, test } from '@playwright/test'
import manageUsersApi from '../mockApis/manageUsersApi'
import frontendComponents from '../mockApis/frontendComponents'
import { login } from '../testUtils'
import search from '../mockApis/search'
import prisonApi from '../mockApis/prisonApi'
import HomePage from '../pages/homePage'
import restrictedPatientApi from '../mockApis/restrictedPatientApi'
import MovePrisonerSearchPage from '../pages/movePrisoner/movePrisonerSearchPage'
import MovePrisonerSelectPage from '../pages/movePrisoner/movePrisonerSelectPage'
import MovePrisonerSelectHospitalPage from '../pages/movePrisoner/movePrisonerSelectHospitalPage'
import MovePrisonerCompletedPage from '../pages/movePrisoner/movePrisonerCompletedPage'
import MovePrisonerConfirmationPage from '../pages/movePrisoner/movePrisonerConfirmationPage'
import ErrorPage from '../pages/errorPage'

test.describe('Move prisoner', () => {
  test.beforeEach(async ({ page }) => {
    await manageUsersApi.stubManageUser()
    await frontendComponents.stubFrontendComponents()
    await login(page, { roles: ['ROLE_TRANSFER_RESTRICTED_PATIENT'] })
    await search.stubSearch()
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
    await restrictedPatientApi.stubDischargeToHospital({
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
        assignedLivingUnit: { description: '1-2-015' },
        categoryCode: 'C',
        alerts: [
          { active: true, alertType: 'T', alertCode: 'TCPA' },
          { active: true, alertType: 'X', alertCode: 'XCU' },
          { active: true, alertType: 'X', alertCode: 'XER' },
          { active: true, alertType: 'R', alertCode: 'RTP' },
        ],
      },
    })
  })

  test('should display the search for prisoner page from the HomePage', async ({ page }) => {
    await HomePage.verifyOnPage(page).then(homePage => homePage.moveToHospital.click())
    await MovePrisonerSearchPage.verifyOnPage(page)
  })

  test('Completes a move prisoner journey', async ({ page }) => {
    await page.goto('/move-to-hospital/search-for-prisoner')
    const prisonerSearchPage = await MovePrisonerSearchPage.verifyOnPage(page)

    await prisonerSearchPage.searchTerm.fill('A1234AA')
    await prisonerSearchPage.submit.click()

    await expect(page).toHaveURL('/move-to-hospital/select-prisoner?searchTerm=A1234AA')

    const prisonerSelectPage = await MovePrisonerSelectPage.verifyOnPage(page)

    const rows = prisonerSelectPage.resultsTable.getByRole('row')
    await expect(rows).toHaveCount(2) // 1 result plus table header
    const cells = rows.nth(1).getByRole('cell')

    await expect(cells.nth(1)).toHaveText('Smith, John')
    await expect(cells.nth(2)).toHaveText('A1234AA')
    await expect(cells.nth(3)).toHaveText('1-2-015')
    await expect(cells.nth(4)).toHaveText('Controlled unlock')
    await expect(cells.nth(5)).toContainText('Move to a hospital')
    await prisonerSelectPage.moveToHospitalLink.click()

    const movePrisonerSelectHospitalPage = await MovePrisonerSelectHospitalPage.verifyOnPage('John Smith', page)

    await expect(movePrisonerSelectHospitalPage.prisonerName).toHaveText('Smith, John')
    await expect(movePrisonerSelectHospitalPage.prisonerNumber).toHaveText('A1234AA')
    await expect(movePrisonerSelectHospitalPage.prisonerCell).toHaveText('1-2-015')
    await expect(movePrisonerSelectHospitalPage.prisonerAlerts).toContainText('Controlled unlock')

    await movePrisonerSelectHospitalPage.hospital.fill('Sheff')
    await page.getByRole('option', { name: 'Sheffield Hospital' }).click()
    await movePrisonerSelectHospitalPage.submit.click()

    const movePrisonerConfirmationPage = await MovePrisonerConfirmationPage.verifyOnPage(
      'John Smith',
      'Sheffield Hospital',
      page,
    )
    await movePrisonerConfirmationPage.confirm.click()

    const movePrisonerCompletedPage = await MovePrisonerCompletedPage.verifyOnPage(
      'John Smith',
      'Sheffield Hospital',
      page,
    )

    await movePrisonerCompletedPage.finish.click()

    await expect(page).toHaveURL('/')
  })

  test.describe('Select prisoner results page', () => {
    test('Displays no results message', async ({ page }) => {
      // @ts-expect-error not bothered since stubbing in a test
      await search.stubSearch({ results: [] })

      await page.goto('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = await MovePrisonerSearchPage.verifyOnPage(page)

      await prisonerSearchPage.searchTerm.fill('A1234AA')
      await prisonerSearchPage.submit.click()

      const prisonerSelectPage = await MovePrisonerSelectPage.verifyOnPage(page)

      await expect(prisonerSelectPage.resultsTable).toBeHidden()
      await expect(prisonerSelectPage.noResultsMessage).toHaveText(
        'There are no results for the details you have entered.',
      )
    })

    test('Handles search again validation', async ({ page }) => {
      await page.goto('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = await MovePrisonerSearchPage.verifyOnPage(page)

      await prisonerSearchPage.searchTerm.fill('A1234AA')
      await prisonerSearchPage.submit.click()

      const prisonerSelectPage = await MovePrisonerSelectPage.verifyOnPage(page)

      await prisonerSelectPage.searchTerm.clear()
      await prisonerSelectPage.submit.click()

      await expect(prisonerSelectPage.errorSummary).toHaveText('Enter a prisoner’s name or number')
    })
  })

  test.describe('Select hospital page', () => {
    test('Handles select hospital validation', async ({ page }) => {
      await page.goto('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = await MovePrisonerSearchPage.verifyOnPage(page)

      await prisonerSearchPage.searchTerm.fill('A1234AA')
      await prisonerSearchPage.submit.click()

      const prisonerSelectPage = await MovePrisonerSelectPage.verifyOnPage(page)

      await prisonerSelectPage.moveToHospitalLink.click()

      const movePrisonerSelectHospitalPage = await MovePrisonerSelectHospitalPage.verifyOnPage('John Smith', page)
      await movePrisonerSelectHospitalPage.submit.click()

      await expect(movePrisonerSelectHospitalPage.errorSummary).toHaveText('Enter a hospital')
    })

    test('Show select hospital validation after entering, selecting and then deleting a hospital selection', async ({
      page,
    }) => {
      await page.goto('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = await MovePrisonerSearchPage.verifyOnPage(page)

      await prisonerSearchPage.searchTerm.fill('A1234AA')
      await prisonerSearchPage.submit.click()

      const prisonerSelectPage = await MovePrisonerSelectPage.verifyOnPage(page)

      await prisonerSelectPage.moveToHospitalLink.click()

      const movePrisonerSelectHospitalPage = await MovePrisonerSelectHospitalPage.verifyOnPage('John Smith', page)

      await movePrisonerSelectHospitalPage.hospital.fill('Sheff')
      await page.getByRole('option', { name: 'Sheffield Hospital' }).click()
      await movePrisonerSelectHospitalPage.hospital.clear()
      movePrisonerSelectHospitalPage.submit.click()

      await expect(movePrisonerSelectHospitalPage.errorSummary).toHaveText('Enter a hospital')
    })

    test('Redirects back to search results when clicking cancel', async ({ page }) => {
      await page.goto('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = await MovePrisonerSearchPage.verifyOnPage(page)

      await prisonerSearchPage.searchTerm.fill('A1234AA')
      await prisonerSearchPage.submit.click()

      const prisonerSelectPage = await MovePrisonerSelectPage.verifyOnPage(page)

      await prisonerSelectPage.moveToHospitalLink.click()

      const movePrisonerSelectHospitalPage = await MovePrisonerSelectHospitalPage.verifyOnPage('John Smith', page)

      await movePrisonerSelectHospitalPage.cancel.click()

      await expect(page).toHaveURL('/move-to-hospital/select-prisoner?searchTerm=A1234AA')
    })
  })

  test.describe('Confirm move page', () => {
    test('Redirects back to search results when clicking cancel', async ({ page }) => {
      await page.goto('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = await MovePrisonerSearchPage.verifyOnPage(page)

      await prisonerSearchPage.searchTerm.fill('A1234AA')
      await prisonerSearchPage.submit.click()

      const prisonerSelectPage = await MovePrisonerSelectPage.verifyOnPage(page)

      await prisonerSelectPage.moveToHospitalLink.click()

      const movePrisonerSelectHospitalPage = await MovePrisonerSelectHospitalPage.verifyOnPage('John Smith', page)
      await movePrisonerSelectHospitalPage.hospital.fill('Sheff')
      await page.getByRole('option', { name: 'Sheffield Hospital' }).click()
      await movePrisonerSelectHospitalPage.submit.click()

      const movePrisonerConfirmationPage = await MovePrisonerConfirmationPage.verifyOnPage(
        'John Smith',
        'Sheffield Hospital',
        page,
      )
      await movePrisonerConfirmationPage.cancel.click()

      await expect(page).toHaveURL('/move-to-hospital/select-prisoner?searchTerm=A1234AA')
    })

    test('Shows error page that continues to the search results when an error occurs during a move', async ({
      page,
    }) => {
      await restrictedPatientApi.stubDischargeToHospital({
        status: 500,
        response: {
          error: 'Error during move',
        },
      })

      await page.goto('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = await MovePrisonerSearchPage.verifyOnPage(page)

      await prisonerSearchPage.searchTerm.fill('A1234AA')
      await prisonerSearchPage.submit.click()

      const prisonerSelectPage = await MovePrisonerSelectPage.verifyOnPage(page)

      await prisonerSelectPage.moveToHospitalLink.click()

      const movePrisonerSelectHospitalPage = await MovePrisonerSelectHospitalPage.verifyOnPage('John Smith', page)

      await movePrisonerSelectHospitalPage.hospital.fill('Sheff')
      await page.getByRole('option', { name: 'Sheffield Hospital' }).click()
      await movePrisonerSelectHospitalPage.submit.click()

      const movePrisonerConfirmationPage = await MovePrisonerConfirmationPage.verifyOnPage(
        'John Smith',
        'Sheffield Hospital',
        page,
      )

      await movePrisonerConfirmationPage.confirm.click()

      const errorPage = await ErrorPage.verifyOnPage('Internal Server Error', page)
      await errorPage.continue.click()

      await expect(page).toHaveURL('/move-to-hospital/select-prisoner?searchTerm=A1234AA')
    })
  })
})
