import 'reflect-metadata'
import { Express } from 'express'
import request from 'supertest'
import { Readable } from 'stream'
import PrisonerSearchService from '../services/prisonerSearchService'
import { appWithAllRoutes } from './testutils/appSetup'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import PrisonApiClient from '../data/prisonApiClient'

jest.mock('../services/prisonerSearchService')

const prisonerSearchService = new PrisonerSearchService(
  {} as PrisonApiClient,
  {} as PrisonerSearchClient,
) as jest.Mocked<PrisonerSearchService>

const app = (roles: string[]): Express =>
  appWithAllRoutes({ production: false, services: { prisonerSearchService }, roles })

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner/:prisonerNumber/image', () => {
  it.each([
    'SEARCH_RESTRICTED_PATIENT',
    'TRANSFER_RESTRICTED_PATIENT',
    'RESTRICTED_PATIENT_MIGRATION',
    'REMOVE_RESTRICTED_PATIENT',
  ])('returns the photo for a user with %s', role => {
    prisonerSearchService.getPrisonerImage.mockResolvedValue(Readable.from(['image']))

    return request(app([role]))
      .get('/prisoner/A1234AA/image')
      .expect('Content-Type', /image\/jpeg/)
      .expect(() => {
        expect(prisonerSearchService.getPrisonerImage).toHaveBeenCalledWith('A1234AA', expect.anything())
      })
  })

  it('does not return the photo for a user without a restricted patients role', () => {
    return request(app(['GLOBAL_SEARCH']))
      .get('/prisoner/A1234AA/image')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(prisonerSearchService.getPrisonerImage).not.toHaveBeenCalled()
      })
  })
})
