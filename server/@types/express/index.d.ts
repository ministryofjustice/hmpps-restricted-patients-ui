import { PrisonUser } from '../../interfaces/hmppsUser'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    journeyStartUrl: query
    returnTo: string
    userDetails: {
      activeCaseLoadId: string
    }
    newMovePrisonerJourney: boolean
    newRemoveRestrictedPatientJourney: boolean
    newAddRestrictedPatientJourney: boolean
    newChangeSupportingPrisonJourney: boolean
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: PrisonUser
    }
  }
}
