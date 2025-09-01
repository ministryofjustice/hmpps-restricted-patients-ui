import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'

import 'reflect-metadata'
import nock from 'nock'
import config from '../config'
import PrisonerSearchClient from './prisonerSearchClient'

describe('prisonerSearchClient', () => {
  let fakePrisonerSearchApi: nock.Scope
  let client: PrisonerSearchClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearch.url)
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>
    client = new PrisonerSearchClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('search by prisoner identifier', async () => {
    const results: unknown[] = []
    fakePrisonerSearchApi
      .post(
        `/prisoner-search/match-prisoners?responseFieldsClient=restricted-patients`,
        '{"includeAliases":false,"prisonerIdentifier":"A1234AA","prisonIds":["PR1","PR2"]}',
      )
      .matchHeader('authorization', 'Bearer test-system-token')
      .reply(200, results)

    const output = await client.search({ prisonerIdentifier: 'A1234AA', prisonIds: ['PR1', 'PR2'] }, 'user1')

    expect(output).toEqual(results)
    expect(nock.isDone()).toBe(true)
  })

  it('search by prisoner name', async () => {
    const results: unknown[] = []
    fakePrisonerSearchApi
      .post(
        `/prisoner-search/match-prisoners?responseFieldsClient=restricted-patients`,
        '{"includeAliases":false,"firstName":"John","lastName":"Smith","prisonIds":["PR1","PR2"]}',
      )
      .matchHeader('authorization', 'Bearer test-system-token')
      .reply(200, results)

    const output = await client.search({ firstName: 'John', lastName: 'Smith', prisonIds: ['PR1', 'PR2'] }, 'user1')

    expect(output).toEqual(results)
    expect(nock.isDone()).toBe(true)
  })

  it('search including aliases', async () => {
    const results: unknown[] = []
    fakePrisonerSearchApi
      .post(
        `/prisoner-search/match-prisoners?responseFieldsClient=restricted-patients`,
        '{"includeAliases":true,"prisonerIdentifier":"A1234AA"}',
      )
      .matchHeader('authorization', 'Bearer test-system-token')
      .reply(200, results)

    const output = await client.search({ includeAliases: true, prisonerIdentifier: 'A1234AA' }, 'user1')

    expect(output).toEqual(results)
    expect(nock.isDone()).toBe(true)
  })

  it('parses response correctly', async () => {
    const response = [
      {
        something: 'to ignore',
        prisonerNumber: 'A1234AA',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: 'LEI-1-2',
        category: 'B',
        sentenceExpiryDate: '2020-09-20',
      },
    ]

    fakePrisonerSearchApi
      .post(
        `/prisoner-search/match-prisoners?responseFieldsClient=restricted-patients`,
        '{"includeAliases":false,"prisonerIdentifier":"A1234AA"}',
      )
      .matchHeader('authorization', 'Bearer test-system-token')
      .reply(200, response)

    const output = await client.search({ prisonerIdentifier: 'A1234AA' }, 'user1')

    expect(output).toEqual([
      {
        prisonerNumber: 'A1234AA',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: 'LEI-1-2',
        category: 'B',
        sentenceExpiryDate: new Date(Date.UTC(2020, 8, 20)),
      },
    ])
    expect(nock.isDone()).toBe(true)
  })

  it('search for restricted patients by prisoner identifier', async () => {
    const response: unknown = { content: [] }
    const results: unknown[] = []
    fakePrisonerSearchApi
      .post(
        `/restricted-patient-search/match-restricted-patients?size=3000&responseFieldsClient=restricted-patients`,
        '{"prisonerIdentifier":"A1234AA"}',
      )
      .matchHeader('authorization', `Bearer ${token}`)
      .reply(200, response)

    const output = await client.restrictedPatientSearch({ prisonerIdentifier: 'A1234AA' }, token)

    expect(output).toEqual(results)
    expect(nock.isDone()).toBe(true)
  })

  it('search for restricted patients by prisoner name', async () => {
    const response: unknown = { content: [] }
    const results: unknown[] = []
    fakePrisonerSearchApi
      .post(
        `/restricted-patient-search/match-restricted-patients?size=3000&responseFieldsClient=restricted-patients`,
        '{"firstName":"John","lastName":"Smith"}',
      )
      .matchHeader('authorization', `Bearer ${token}`)
      .reply(200, response)

    const output = await client.restrictedPatientSearch({ firstName: 'John', lastName: 'Smith' }, token)

    expect(output).toEqual(results)
    expect(nock.isDone()).toBe(true)
  })

  it('search for restricted patients parses response correctly', async () => {
    const response = {
      content: [
        {
          something: 'to ignore',
          prisonerNumber: 'A1234AA',
          firstName: 'John',
          lastName: 'Smith',
          cellLocation: 'LEI-1-2',
          category: 'B',
          sentenceExpiryDate: '2020-09-20',
          alerts: [
            {
              alertType: 'T',
              alertCode: 'TAP',
            },
          ],
          locationDescription: 'Outside - released from Moorland (HMP & YOI)',
          restrictedPatient: true,
          supportingPrisonId: 'MDI',
          dischargedHospitalDescription: 'Hazelwood House',
        },
      ],
    }

    fakePrisonerSearchApi
      .post(
        `/restricted-patient-search/match-restricted-patients?size=3000&responseFieldsClient=restricted-patients`,
        '{"prisonerIdentifier":"A1234AA"}',
      )
      .matchHeader('authorization', `Bearer ${token}`)
      .reply(200, response)

    const output = await client.restrictedPatientSearch({ prisonerIdentifier: 'A1234AA' }, token)

    expect(output).toEqual([
      {
        prisonerNumber: 'A1234AA',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: 'LEI-1-2',
        category: 'B',
        sentenceExpiryDate: new Date(Date.UTC(2020, 8, 20)),
        locationDescription: 'Outside - released from Moorland (HMP & YOI)',
        restrictedPatient: true,
        alerts: [
          {
            alertType: 'T',
            alertCode: 'TAP',
          },
        ],
        supportingPrisonId: 'MDI',
        dischargedHospitalDescription: 'Hazelwood House',
      },
    ])
    expect(nock.isDone()).toBe(true)
  })
})
