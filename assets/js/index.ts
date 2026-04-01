import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import setupCards from './card'
import setupAutocomplete from './autocomplete-agency'

govukFrontend.initAll()
mojFrontend.initAll()

document.addEventListener('DOMContentLoaded', () => {
  const body = document.querySelector('body')
  const pageType = body.getAttribute('data-page')
  switch (pageType) {
    case 'homepage':
      setupCards()
      break
    case 'agency-autocomplete':
      setupAutocomplete()
      break
  }
})
