import { expect, test } from '@playwright/test'
import manageUsersApi from '../mockApis/manageUsersApi'
import frontendComponents from '../mockApis/frontendComponents'
import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'
import AuthSignInPage from '../pages/authSignInPage'
import hmppsAuth from '../mockApis/hmppsAuth'
import AuthManageDetailsPage from '../pages/authManageDetailsPage'
import AddPrisonerSearchPage from '../pages/addPrisoner/addPrisonerSearchPage'

test.describe('Frontend Components', () => {
  test.beforeEach(async ({ page }) => {
    await manageUsersApi.stubManageUser()
    await frontendComponents.stubFrontendComponents()
    await login(page, { roles: ['ROLE_RESTRICTED_PATIENT_MIGRATION'] })
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('User can sign out', async ({ page }) => {
    const landingPage = await HomePage.verifyOnPage(page)
    await landingPage.signoutLink.click()
    await AuthSignInPage.verifyOnPage(page)
  })

  test('User can manage their details', async ({ page }) => {
    await hmppsAuth.stubManageDetailsPage()

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.clickManageUserDetails()

    await AuthManageDetailsPage.verifyOnPage(page)
  })

  test('User name visible in header', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.usersName).toHaveText('J. Smith')
  })

  test('Phase banner visible in header', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.phaseBanner).toHaveText('DEV')
  })

  test('should display the correct details for the signed in user', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.usersName).toHaveText('J. Smith')
    await expect(homePage.changeLocationLink).toHaveText('Moorland (HMP)')

    await expect(homePage.manageUserDetails).toHaveAttribute('href', 'http://localhost:9091/auth/account-details')
  })

  test('should show change location link when user has more than 1 caseload', async ({ page }) => {
    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.changeLocationLink).toHaveAttribute('href', 'http://localhost:3002/change-caseload')
  })

  test('should display header even for post request errors', async ({ page }) => {
    await page.goto('/add-restricted-patient/search-for-prisoner')
    const searchPage = await AddPrisonerSearchPage.verifyOnPage(page)
    await searchPage.submit.click()

    const postedSearchPage = await AddPrisonerSearchPage.verifyOnPage(page)

    await expect(postedSearchPage.usersName).toHaveText('J. Smith')
    await expect(postedSearchPage.changeLocationLink).toHaveText('Moorland (HMP)')
    await expect(postedSearchPage.signoutLink).toBeVisible()
  })
})
