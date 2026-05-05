import { Request, Response } from 'express'
import UserService from '../../services/userService'
import { hasAnyRole } from '../../utils/utils'
import config from '../../config'

type TaskType = {
  id: string
  heading: string
  href: string
  description: string
  roles: Array<string> | null
  enabled: boolean
}

export const tasks: TaskType[] = [
  {
    id: 'search-restricted-patient',
    heading: 'Search for a restricted patient',
    description: 'Search for a restricted patient to view their details or add a case note.',
    href: '/view-restricted-patients/search-for-patient',
    roles: ['SEARCH_RESTRICTED_PATIENT'],
    enabled: true,
  },
  {
    id: 'move-to-hospital',
    heading: 'Move someone to a hospital',
    description:
      'Move someone from either a prison or court to a hospital when detained under the Mental Health Act. This also changes them to a restricted patient.',
    href: '/move-to-hospital/search-for-prisoner',
    roles: ['TRANSFER_RESTRICTED_PATIENT'],
    enabled: true,
  },
  {
    id: 'remove-from-restricted-patients',
    heading: 'Remove someone from restricted patients',
    description: 'Remove someone from restricted patients when they are no longer the responsibility of a prison.',
    href: '/remove-from-restricted-patients/search-for-patient',
    roles: ['REMOVE_RESTRICTED_PATIENT'],
    enabled: true,
  },
  {
    id: 'add-restricted-patient',
    heading: 'Add a released prisoner into restricted patients',
    description:
      'Add a released prisoner into the restricted patients service.  This amends a prisoner’s record who has previously been released using NOMIS to be a restricted patient and alters their last movement to include the hospital location.',
    href: '/add-restricted-patient/search-for-prisoner',
    roles: ['RESTRICTED_PATIENT_MIGRATION'],
    enabled: true,
  },
  {
    id: 'change-supporting-prison',
    heading: 'Change a supporting prison',
    description:
      'Change the supporting prison of an existing restricted patient.  Note that this does not amend the prison that the patient was released from, instead it alters the prison that is currently responsible for the patient.',
    href: '/change-supporting-prison/search-for-patient',
    roles: ['RESTRICTED_PATIENT_MIGRATION'],
    enabled: true,
  },
  {
    id: 'help',
    heading: 'Help and support',
    description: 'View help and FAQ.',
    href: '/help',
    roles: null,
    enabled: true,
  },
]

export default class HomepageRoutes {
  constructor(private readonly userService: UserService) {}

  view = async (_req: Request, res: Response): Promise<void> => {
    const { userRoles } = res.locals.user
    const availableTasks = tasks.filter(task => task.enabled).filter(task => hasAnyRole(task.roles, userRoles))

    if (!availableTasks.length)
      return res.status(401).render('pages/error', {
        title: 'You do not have permission to view this page',
        url: config.dpsUrl,
      })
    return res.render('pages/homepage', {
      tasks: availableTasks,
    })
  }
}
