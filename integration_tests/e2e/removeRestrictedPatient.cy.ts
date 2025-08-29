import RestrictedPatientSearchPage from '../pages/removeRestrictedPatient/removeRestrictedPatientSearch.page'
import RestrictedPatientSelectPage from '../pages/removeRestrictedPatient/removeRestrictedPatientSelect.page'
import RemoveRestrictedPatientConfirmationPage from '../pages/removeRestrictedPatient/removeRestrictedPatientConfirmation.page'
import RemoveRestrictedPatientCompletedPage from '../pages/removeRestrictedPatient/removeRestrictedPatientCompleted.page'
import HomePage from '../pages/home.page'
import Page from '../pages/page'

const toOffender = $cell => ({
  name: $cell[1].textContent,
  prisonerNumber: $cell[2].textContent,
  location: $cell[3].textContent,
  removeRestrictedPatientLink: $cell[4].textContent,
})

context('Remove restricted patient', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['REMOVE_RESTRICTED_PATIENT'] })
    cy.task('stubManageUser')
    cy.task('stubFrontendComponents')
    cy.task('stubRestrictedPatientSearch', {
      query: {
        equalToJson: {
          prisonerIdentifier: 'A1234AA',
        },
      },
      results: {
        content: [
          {
            cellLocation: '1-2-015',
            firstName: 'JOHN',
            lastName: 'SMITH',
            prisonerNumber: 'A1234AA',
            supportingPrisonId: 'MDI',
            dischargedHospitalDescription: 'Sheffield Hospital',
          },
        ],
      },
    })
    cy.task('stubGetAgenciesByType', {
      type: 'INST',
      response: [
        {
          agencyId: 'MDI',
          description: 'Moorland',
          longDescription: 'HMP Moorland',
          agencyType: 'INST',
          active: true,
        },
        {
          agencyId: 'DNI',
          description: 'Doncaster',
          longDescription: 'HMP Doncaster',
          agencyType: 'INST',
          active: true,
        },
      ],
    })
    cy.task('stubGetPrisonerDetails', {
      prisonerNumber: 'A1234AA',
      response: {
        offenderNo: 'A1234AA',
        firstName: 'JOHN',
        lastName: 'SMITH',
        assignedLivingUnit: { description: '1-2-015' },
        categoryCode: 'C',
        alerts: [
          { alertType: 'T', alertCode: 'TCPA' },
          { alertType: 'X', alertCode: 'XCU' },
        ],
      },
    })
    cy.task('stubGetPatient', {
      prisonerNumber: 'A1234AA',
      response: {
        hospitalLocation: {
          description: 'Sheffield Hospital',
        },
      },
    })
    cy.task('stubRemovePatient', { prisonerNumber: 'A1234AA' })
    cy.signIn()
  })

  it('should display the search for patient page from the HomePage', () => {
    const page = Page.verifyOnPage(HomePage)
    page.removeFromRestrictedPatients().click()
    Page.verifyOnPage(RestrictedPatientSearchPage)
  })

  it('Progresses through the removal of a restricted patient journey', () => {
    cy.visit('/remove-from-restricted-patients/search-for-patient')
    const restrictedPatientSearchPage = Page.verifyOnPage(RestrictedPatientSearchPage)

    restrictedPatientSearchPage.searchTerm().type('A1234AA')
    restrictedPatientSearchPage.submit().click()

    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/remove-from-restricted-patients/select-patient')
      expect(loc.search).to.eq('?searchTerm=A1234AA')
    })

    const restrictedPatientSelectPage = Page.verifyOnPage(RestrictedPatientSelectPage)

    restrictedPatientSelectPage
      .resultsTable()
      .find('tr')
      .should($tableRows => {
        expect($tableRows).to.have.length(2) // 1 result plus table header
        const offenders = Array.from($tableRows).map($row => toOffender($row.cells))

        expect(offenders[1].name).to.contain('Smith, John')
        expect(offenders[1].prisonerNumber).to.eq('A1234AA')
        expect(offenders[1].location).to.eq('Sheffield Hospital')
        expect(offenders[1].removeRestrictedPatientLink).to.contain('Remove as a restricted patient')
      })
    restrictedPatientSelectPage.viewPrisonerProfile().should('have.attr', 'href').and('include', '/prisoner/A1234AA')
    restrictedPatientSelectPage
      .removeRestrictedPatientLink()
      .should('have.attr', 'href')
      .and('include', '/remove-from-restricted-patients?prisonerNumber=A1234AA')

    restrictedPatientSelectPage.removeRestrictedPatientLink().click()

    const removeRestrictedPatientConfirmationPage = Page.verifyOnPageWithTitleParam(
      RemoveRestrictedPatientConfirmationPage,
      'John Smith',
    )

    removeRestrictedPatientConfirmationPage.patientName().should('contain', 'Smith, John')
    removeRestrictedPatientConfirmationPage.prisonerNumber().should('contain', 'A1234AA')
    removeRestrictedPatientConfirmationPage.patientHospital().should('contain', 'Sheffield Hospital')

    removeRestrictedPatientConfirmationPage.confirmRemoval().click()

    const removeRestrictedPatientCompletedPage = Page.verifyOnPageWithTitleParam(
      RemoveRestrictedPatientCompletedPage,
      'John Smith',
    )

    removeRestrictedPatientCompletedPage.finishButton().click()

    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/')
    })
  })

  it('Cancel the progress through the removal of a restricted patient journey', () => {
    cy.visit('/remove-from-restricted-patients/search-for-patient')
    const restrictedPatientSearchPage = Page.verifyOnPage(RestrictedPatientSearchPage)

    restrictedPatientSearchPage.searchTerm().type('A1234AA')
    restrictedPatientSearchPage.submit().click()
    const restrictedPatientSelectPage = Page.verifyOnPage(RestrictedPatientSelectPage)
    restrictedPatientSelectPage.removeRestrictedPatientLink().click()
    const removeRestrictedPatientConfirmationPage = Page.verifyOnPageWithTitleParam(
      RemoveRestrictedPatientConfirmationPage,
      'John Smith',
    )
    removeRestrictedPatientConfirmationPage.cancelRemoval().click()

    const restrictedPatientSelectPage2 = Page.verifyOnPage(RestrictedPatientSelectPage)
    restrictedPatientSelectPage2.searchTerm().should('have.value', 'A1234AA')
  })

  it('Handles search form validation', () => {
    cy.visit('/remove-from-restricted-patients/search-for-patient')
    const restrictedPatientSearchPage = Page.verifyOnPage(RestrictedPatientSearchPage)

    restrictedPatientSearchPage.submit().click()

    restrictedPatientSearchPage
      .errorSummaryList()
      .find('li')
      .then($errors => {
        expect($errors.get(0).innerText).to.contain('Enter a restricted patient’s name or prison number')
      })
  })

  describe('View restricted patients results page', () => {
    it('Displays no results message', () => {
      cy.task('stubRestrictedPatientSearch', {
        results: {
          content: [],
        },
      })

      cy.visit('/remove-from-restricted-patients/search-for-patient')
      const restrictedPatientSearchPage = Page.verifyOnPage(RestrictedPatientSearchPage)

      restrictedPatientSearchPage.searchTerm().type('A1234AA')
      restrictedPatientSearchPage.submit().click()

      const restrictedPatientSelectPage = Page.verifyOnPage(RestrictedPatientSelectPage)

      restrictedPatientSelectPage.resultsTable().should('not.exist')
      restrictedPatientSelectPage
        .noResultsMessage()
        .should('contain', 'There are no results for the details you have entered.')
    })

    it('Handles search again', () => {
      cy.visit('/remove-from-restricted-patients/search-for-patient')
      const restrictedPatientSearchPage = Page.verifyOnPage(RestrictedPatientSearchPage)

      restrictedPatientSearchPage.searchTerm().type('A1234AA')
      restrictedPatientSearchPage.submit().click()

      const restrictedPatientSelectPage = Page.verifyOnPage(RestrictedPatientSelectPage)

      restrictedPatientSelectPage.searchTerm().clear()
      restrictedPatientSelectPage.submit().click()

      restrictedPatientSelectPage
        .errorSummaryList()
        .find('li')
        .then($errors => {
          expect($errors.get(0).innerText).to.contain('Enter a restricted patient’s name or prison number')
        })

      restrictedPatientSelectPage.searchTerm().type('A1234AA')
      restrictedPatientSelectPage.submit().click()

      restrictedPatientSelectPage
        .resultsTable()
        .find('tr')
        .should($tableRows => {
          expect($tableRows).to.have.length(2) // 1 result plus table header
          const offenders = Array.from($tableRows).map($row => toOffender($row.cells))

          expect(offenders[1].name).to.contain('Smith, John')
        })
    })

    it('Handles empty search from select', () => {
      cy.visit('/remove-from-restricted-patients/select-patient')
      Page.verifyOnPage(RestrictedPatientSearchPage)
    })
  })
})
