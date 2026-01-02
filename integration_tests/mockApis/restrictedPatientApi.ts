import { stubFor } from './wiremock'

const stubPing = (httpStatus = 200) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/restrictedPatientApi/health/ping',
    },
    response: {
      status: httpStatus,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
    },
  })

const stubDischargeToHospital = ({ status, response = [] }: { status: number; response: object }) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/restrictedPatientApi/discharge-to-hospital',
    },
    response: {
      status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: response,
    },
  })

const stubMigrateToHospital = ({ status, response = [] }: { status: number; response: object }) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/restrictedPatientApi/migrate-in-restricted-patient',
    },
    response: {
      status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: response,
    },
  })

const stubGetPatient = ({
  prisonerNumber,
  status = 200,
  response = [],
}: {
  prisonerNumber: string
  status: number
  response: object
}) =>
  stubFor({
    request: {
      method: 'GET',
      url: `/restrictedPatientApi/restricted-patient/prison-number/${prisonerNumber}`,
    },
    response: {
      status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: response,
    },
  })

const stubRemovePatient = ({
  prisonerNumber,
  status = 200,
  response = {},
}: {
  prisonerNumber: string
  status: number
  response: object
}) =>
  stubFor({
    request: {
      method: 'DELETE',
      url: `/restrictedPatientApi/restricted-patient/prison-number/${prisonerNumber}`,
    },
    response: {
      status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: response,
    },
  })

const stubChangeSupportingPrison = ({ status, response = [] }: { status: number; response: object }) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/restrictedPatientApi/change-supporting-prison',
    },
    response: {
      status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: response,
    },
  })

export default {
  stubPing,
  stubDischargeToHospital,
  stubGetPatient,
  stubRemovePatient,
  stubMigrateToHospital,
  stubChangeSupportingPrison,
}
