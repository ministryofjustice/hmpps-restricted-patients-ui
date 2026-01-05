import { expect, test } from '@playwright/test'
import manageUsersApi from '../mockApis/manageUsersApi'
import frontendComponents from '../mockApis/frontendComponents'
import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'
import hmppsAuth from '../mockApis/hmppsAuth'
import AuthSignInPage from '../pages/authSignInPage'

test.describe('Frontend Components Fallback', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubManageUser()
    await frontendComponents.stubGetComponentsMappingError()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Unauthenticated user directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await page.goto('/')

    await AuthSignInPage.verifyOnPage(page)
  })

  test('User can sign out', async ({ page }) => {
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.signOut()

    await AuthSignInPage.verifyOnPage(page)
  })

  test.describe('Header', () => {
    test('should not should user name for the signed in user', async ({ page }) => {
      await login(page, { name: 'Bobby Brown' })

      const homePage = await HomePage.verifyOnPage(page)

      // headder and manage account not displayed in fallback
      await expect(homePage.usersName).toBeHidden()
      await expect(homePage.manageUserDetails).toBeHidden()
    })

    test('should not show change location link in the fallback', async ({ page }) => {
      await login(page)

      const homePage = await HomePage.verifyOnPage(page)

      await expect(homePage.changeLocationLink).toBeHidden()
    })
  })
})
