import { stubFor } from './wiremock'

const stubSearchPing = (httpStatus = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/search/health/ping',
    },
    response: {
      status: httpStatus,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
    },
  })

const defaultSearchQuery = {
  equalToJson: {
    prisonerIdentifier: 'A1234AA',
    prisonIds: ['MDI'],
    includeAliases: false,
  },
}

const defaultSearchResponse = [
  {
    alerts: [
      { active: true, alertType: 'T', alertCode: 'TCPA' },
      { active: true, alertType: 'X', alertCode: 'XCU' },
    ],
    cellLocation: '1-2-015',
    firstName: 'JOHN',
    lastName: 'SMITH',
    prisonerNumber: 'A1234AA',
    prisonName: 'HMP Moorland',
    locationDescription: 'Outside - released from Doncaster',
    restrictedPatient: false,
    lastMovementTypeCode: 'REL',
    lastMovementReasonCode: 'HP',
    indeterminateSentence: true,
    recall: false,
  },
]

const defaultStubbing = { query: defaultSearchQuery, results: defaultSearchResponse }

const stubSearch = ({ query = defaultSearchQuery, results = defaultSearchResponse } = defaultStubbing) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/search/prisoner-search/match-prisoners\\?responseFieldsClient=restricted-patients',
      bodyPatterns: [query],
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: results,
    },
  })

const stubRestrictedPatientSearch = ({ results = defaultSearchResponse } = defaultStubbing) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern:
        '/search/restricted-patient-search/match-restricted-patients\\?size=3000&responseFieldsClient=restricted-patients',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: results,
    },
  })

export default {
  stubSearchPing,
  stubSearch,
  stubRestrictedPatientSearch,
}
