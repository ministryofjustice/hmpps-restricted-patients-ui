import { expect, test } from '@playwright/test'
import prisonApi from '../mockApis/prisonApi'
import restrictedPatientApi from '../mockApis/restrictedPatientApi'
import manageUsersApi from '../mockApis/manageUsersApi'
import search from '../mockApis/search'
import hmppsAuth from '../mockApis/hmppsAuth'
import tokenVerification from '../mockApis/tokenVerification'

import { resetStubs } from '../testUtils'

// NB: add new mock apis here:
const mockApis = [hmppsAuth, tokenVerification, prisonApi, restrictedPatientApi, manageUsersApi, search]

test.describe('Health', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test.describe('All healthy', () => {
    test.beforeEach(async () => {
      await Promise.all(mockApis.map(api => api.stubPing()))
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
    test('Health check status is down for 1 api', async ({ page }) => {
      await Promise.all(mockApis.map(api => (api === tokenVerification ? api.stubPing(500) : api.stubPing())))

      const response = await page.request.get('/health')
      const payload = await response.json()
      expect(payload.status).toBe('DOWN')
      expect(payload.components.hmppsAuth.status).toBe('UP')
      expect(payload.components.tokenVerification.status).toBe('DOWN')
      expect(payload.components.tokenVerification.details.status).toBe(500)
      expect(payload.components.tokenVerification.details.attempts).toBe(3)
      expect(
        Object.values<{ status: 'UP' | 'DOWN' }>(payload.components).reduce(
          (downCount, api) => (api.status === 'DOWN' ? downCount + 1 : downCount),
          0,
        ),
      ).toEqual(1)
    })
  })
})
