import { stubFor } from './wiremock'

const stubPing = (httpStatus = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/prisonApi/health/ping',
    },
    response: {
      status: httpStatus,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
    },
  })

const stubGetAgenciesByType = ({
  type,
  response = [],
  active = true,
}: {
  type: string
  response: Array<string>
  active: boolean
}) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/prisonApi/api/agencies/type/${type}?active=${active}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: response,
    },
  })

const stubGetAgencyDetails = ({ id, response = {} }: { id: string; response: object }) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/prisonApi/api/agencies/${id}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: response,
    },
  })

const stubGetPrisonerDetails = ({ prisonerNumber, response = {} }: { prisonerNumber: string; response: object }) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/prisonApi/api/offenders/${prisonerNumber}`,
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: response,
    },
  })

export default {
  stubPing,
  stubGetAgenciesByType,
  stubGetAgencyDetails,
  stubGetPrisonerDetails,
}
