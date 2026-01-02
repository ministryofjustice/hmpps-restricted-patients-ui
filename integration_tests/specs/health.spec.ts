import { expect, test } from '@playwright/test'
import hmppsAuth from '../mockApis/hmppsAuth'
import tokenVerification from '../mockApis/tokenVerification'

import { resetStubs } from '../testUtils'
import prisonApi from '../mockApis/prisonApi'
import restrictedPatientApi from '../mockApis/restrictedPatientApi'
import manageUsersApi from '../mockApis/manageUsersApi'
import search from '../mockApis/search'

test.describe('Health', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('All healthy', () => {
    test.beforeEach(async () => {
      await Promise.all([
        hmppsAuth.stubPing(),
        manageUsersApi.stubPing(),
        restrictedPatientApi.stubPing(),
        prisonApi.stubPing(),
        search.stubPing(),
        tokenVerification.stubPing(),
      ])
    })

    test('Health check is accessible and status is UP', async ({ page }) => {
      const response = await page.request.get('/health')
      const payload = await response.json()
      expect(payload.status).toBe('UP')
    })

    test('All dependant APIs are healthy', async ({ page }) => {
      const response = await page.request.get('/health')
      const payload = await response.json()
      expect(payload.components).toEqual({
        hmppsAuth: { status: 'UP' },
        manageUsersApi: { status: 'UP' },
        prisonerSearch: { status: 'UP' },
        tokenVerification: { status: 'UP' },
        prisonApi: { status: 'UP' },
        restrictedPatientApi: { status: 'UP' },
      })
    })

    test('Ping is accessible and status is UP', async ({ page }) => {
      const response = await page.request.get('/ping')
      const payload = await response.json()
      expect(payload.status).toBe('UP')
    })

    test('Info is accessible', async ({ page }) => {
      const response = await page.request.get('/info')
      const payload = await response.json()
      expect(payload.build.name).toBe('hmpps-restricted-patients-ui')
    })
  })

  test.describe('Some unhealthy', () => {
    test.beforeEach(async () => {
      await Promise.all([
        hmppsAuth.stubPing(),
        manageUsersApi.stubPing(),
        restrictedPatientApi.stubPing(500),
        prisonApi.stubPing(500),
        search.stubPing(500),
        tokenVerification.stubPing(500),
      ])
    })

    test('Health check status is down', async ({ page }) => {
      const response = await page.request.get('/health')
      const payload = await response.json()
      expect(payload.status).toBe('DOWN')
      expect(payload.components.hmppsAuth.status).toBe('UP')
      expect(payload.components.manageUsersApi.status).toBe('UP')
      expect(payload.components.restrictedPatientApi.status).toBe('DOWN')
      expect(payload.components.tokenVerification.status).toBe('DOWN')
      expect(payload.components.tokenVerification.details.status).toBe(500)
      expect(payload.components.tokenVerification.details.attempts).toBe(3)
    })

    test('Some dependant APIs are unhealthy', async ({ page }) => {
      const response = await page.request.get('/health')
      const payload = await response.json()
      expect(payload.status).toBe('DOWN')
      expect(payload.components.hmppsAuth.status).toBe('UP')
      expect(payload.components.prisonerSearch.status).toBe('DOWN')
      expect(payload.components.prisonerSearch.details).toEqual({
        status: 500,
        attempts: 3,
        message: 'Internal Server Error',
      })
      expect(payload.components.tokenVerification.status).toBe('DOWN')
      expect(payload.components.tokenVerification.details).toEqual({
        status: 500,
        attempts: 3,
        message: 'Internal Server Error',
      })
      expect(payload.components.prisonApi.status).toBe('DOWN')
      expect(payload.components.restrictedPatientApi.status).toBe('DOWN')
    })
  })
})
