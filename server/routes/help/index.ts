import express, { Router } from 'express'
// eslint-disable-next-line import/no-cycle
import HelpRoutes from './help'

export default function helpRoutes(): Router {
  const router = express.Router()

  const helpPage = new HelpRoutes()

  router.get('/', helpPage.view)
  return router
}

// TODO this shadow error is supposed to be fixed https://github.com/typescript-eslint/tslint-to-eslint-config/issues/856

export enum HelpCategory {
  ABOUT_PATIENTS = 'about-restricted-patients',
  ISSUES = 'operational-issues',
  PRODUCT_INFO = 'product-info',
  ROLES = 'roles',
  ACCOUNTS = 'accounts',
}

export type HelpSection = {
  id: string
  category: HelpCategory
  heading: string
  content: string
}

export interface HelpContent {
  title: string
  category: HelpCategory
  helpItems: HelpSection[]
}
