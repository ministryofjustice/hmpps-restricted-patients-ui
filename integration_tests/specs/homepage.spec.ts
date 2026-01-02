import { expect, test } from '@playwright/test'

import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'
import manageUsersApi from '../mockApis/manageUsersApi'
import frontendComponents from '../mockApis/frontendComponents'

test.describe('Homepage', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubManageUser()
    await frontendComponents.stubFrontendComponents()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('Tasks', () => {
    test('should only show help page if there are no roles present', async ({ page }) => {
      await login(page, { roles: ['ROLE_RANDOM_ROLE'] })
      const homePage = await HomePage.verifyOnPage(page)

      await expect(homePage.searchRestrictedPatient).toBeHidden()
      await expect(homePage.moveToHospital).toBeHidden()
      await expect(homePage.addRestrictedPatient).toBeHidden()
      await expect(homePage.removeFromRestrictedPatients).toBeHidden()
      await expect(homePage.helpLink).toBeVisible()
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
