import { expect, test } from '@playwright/test'

import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'
import manageUsersApi from '../mockApis/manageUsersApi'
import frontendComponents from '../mockApis/frontendComponents'
import ErrorPage from '../pages/errorPage'
import AddPrisonerSearchPage from '../pages/addPrisoner/addPrisonerSearchPage'
import MovePrisonerSearchPage from '../pages/movePrisoner/movePrisonerSearchPage'
import RemoveRestrictedPatientSearchPage from '../pages/removeRestrictedPatient/removeRestrictedPatientSearchPage'
import RestrictedPatientSearchPage from '../pages/viewRestrictedPatients/restrictedPatientSearchPage'
import PatientSearchPage from '../pages/changeSupportingPrison/patientSearchPage'

const searchPages = [
  { url: '/add-restricted-patient/search-for-prisoner', expectedPage: AddPrisonerSearchPage },
  { url: '/change-supporting-prison/search-for-patient', expectedPage: PatientSearchPage },
  { url: '/move-to-hospital/search-for-prisoner', expectedPage: MovePrisonerSearchPage },
  { url: '/remove-from-restricted-patients/search-for-patient', expectedPage: RemoveRestrictedPatientSearchPage },
  { url: '/view-restricted-patients/search-for-patient', expectedPage: RestrictedPatientSearchPage },
]

test.describe('Homepage', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubManageUser()
    await frontendComponents.stubFrontendComponents()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('Tasks', () => {
    test.describe('no roles present', () => {
      searchPages.forEach(({ url }) => {
        test(`should prevent direct access to ${url}`, async ({ page }) => {
          await login(page, { roles: ['ROLE_RANDOM_ROLE'] })
          await page.goto(url)
          await ErrorPage.verifyOnPage('Not found', page)
        })
      })

      test('should only show help page if there are no roles present', async ({ page }) => {
        await login(page, { roles: ['ROLE_RANDOM_ROLE'] })
        const homePage = await HomePage.verifyOnPage(page)

        await expect(homePage.searchRestrictedPatient).toBeHidden()
        await expect(homePage.moveToHospital).toBeHidden()
        await expect(homePage.addRestrictedPatient).toBeHidden()
        await expect(homePage.removeFromRestrictedPatients).toBeHidden()
        await expect(homePage.helpLink).toBeVisible()
      })
    })

    test.describe('all roles present', () => {
      searchPages.forEach(({ url, expectedPage }) => {
        test(`should allow direct access to ${url}`, async ({ page }) => {
          await login(page)
          await page.goto(url)
          await expectedPage.verifyOnPage(page)
        })
      })

      test('should only all tiles', async ({ page }) => {
        await login(page)
        const homePage = await HomePage.verifyOnPage(page)

        await expect(homePage.searchRestrictedPatient).toBeVisible()
        await expect(homePage.moveToHospital).toBeVisible()
        await expect(homePage.addRestrictedPatient).toBeVisible()
        await expect(homePage.removeFromRestrictedPatients).toBeVisible()
        await expect(homePage.helpLink).toBeVisible()
      })
    })

    test('should show search restricted patient', async ({ page }) => {
      await login(page, { roles: ['ROLE_SEARCH_RESTRICTED_PATIENT'] })
      const homePage = await HomePage.verifyOnPage(page)

      await expect(homePage.searchRestrictedPatient).toBeVisible()
      await expect(homePage.moveToHospital).toBeHidden()
      await expect(homePage.addRestrictedPatient).toBeHidden()
      await expect(homePage.removeFromRestrictedPatients).toBeHidden()
      await expect(homePage.helpLink).toBeVisible()
    })
    test('should show move to hospital', async ({ page }) => {
      await login(page, { roles: ['ROLE_TRANSFER_RESTRICTED_PATIENT'] })
      const homePage = await HomePage.verifyOnPage(page)

      await expect(homePage.moveToHospital).toBeVisible()
      await expect(homePage.addRestrictedPatient).toBeHidden()
      await expect(homePage.searchRestrictedPatient).toBeHidden()
      await expect(homePage.removeFromRestrictedPatients).toBeHidden()
      await expect(homePage.helpLink).toBeVisible()
    })
    test('should show migrate into hospital', async ({ page }) => {
      await login(page, { roles: ['ROLE_RESTRICTED_PATIENT_MIGRATION'] })
      const homePage = await HomePage.verifyOnPage(page)

      await expect(homePage.moveToHospital).toBeHidden()
      await expect(homePage.addRestrictedPatient).toBeVisible()
      await expect(homePage.searchRestrictedPatient).toBeHidden()
      await expect(homePage.removeFromRestrictedPatients).toBeHidden()
      await expect(homePage.helpLink).toBeVisible()
    })
    test('should show remove from restricted patients', async ({ page }) => {
      await login(page, { roles: ['ROLE_REMOVE_RESTRICTED_PATIENT'] })
      const homePage = await HomePage.verifyOnPage(page)

      await expect(homePage.removeFromRestrictedPatients).toBeVisible()
      await expect(homePage.moveToHospital).toBeHidden()
      await expect(homePage.addRestrictedPatient).toBeHidden()
      await expect(homePage.searchRestrictedPatient).toBeHidden()
      await expect(homePage.helpLink).toBeVisible()
    })
    test('should show all tasks', async ({ page }) => {
      await login(page)
      const homePage = await HomePage.verifyOnPage(page)

      await expect(homePage.removeFromRestrictedPatients).toBeVisible()
      await expect(homePage.moveToHospital).toBeVisible()
      await expect(homePage.addRestrictedPatient).toBeVisible()
      await expect(homePage.searchRestrictedPatient).toBeVisible()
      await expect(homePage.helpLink).toBeVisible()
    })
  })
})
