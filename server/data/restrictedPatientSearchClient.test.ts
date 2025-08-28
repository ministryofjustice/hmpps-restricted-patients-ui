import 'reflect-metadata'
import nock from 'nock'
import config from '../config'
import RestrictedPatientSearchClient from './restrictedPatientSearchClient'

describe('restrictedPatientSearchClient', () => {
  let fakePrisonerSearchApi: nock.Scope
  let client: RestrictedPatientSearchClient

  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearch.url)
    client = new RestrictedPatientSearchClient()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('search by prisoner identifier', async () => {
    const response: unknown = { content: [] }
    const results: unknown[] = []
    fakePrisonerSearchApi
      .post(`/restricted-patient-search/match-restricted-patients?size=3000`, '{"prisonerIdentifier":"A1234AA"}')
      .matchHeader('authorization', `Bearer ${token}`)
      .reply(200, response)

    const output = await client.search({ prisonerIdentifier: 'A1234AA' }, token)

    expect(output).toEqual(results)
    expect(nock.isDone()).toBe(true)
  })

  it('search by prisoner name', async () => {
    const response: unknown = { content: [] }
    const results: unknown[] = []
    fakePrisonerSearchApi
      .post(`/restricted-patient-search/match-restricted-patients?size=3000`, '{"firstName":"John","lastName":"Smith"}')
      .matchHeader('authorization', `Bearer ${token}`)
      .reply(200, response)

    const output = await client.search({ firstName: 'John', lastName: 'Smith' }, token)

    expect(output).toEqual(results)
    expect(nock.isDone()).toBe(true)
  })

  it('parses response correctly', async () => {
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
      .post(`/restricted-patient-search/match-restricted-patients?size=3000`, '{"prisonerIdentifier":"A1234AA"}')
      .matchHeader('authorization', `Bearer ${token}`)
      .reply(200, response)

    const output = await client.search({ prisonerIdentifier: 'A1234AA' }, token)

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
