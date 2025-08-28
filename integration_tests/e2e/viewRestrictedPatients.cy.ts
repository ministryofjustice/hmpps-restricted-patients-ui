import RestrictedPatientSearchPage from '../pages/viewRestrictedPatients/restrictedPatientSearch.page'
import ViewRestrictedPatientsPage from '../pages/viewRestrictedPatients/viewRestrictedPatients.page'
import HomePage from '../pages/home.page'
import Page from '../pages/page'

const toOffender = $cell => ({
  name: $cell[1].textContent,
  prisonerNumber: $cell[2].textContent,
  location: $cell[3].textContent,
  supportingPrison: $cell[4].textContent,
  addACaseNoteLink: $cell[5].textContent,
})

context('View restricted patients', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['SEARCH_RESTRICTED_PATIENT'] })
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
            supportingPrisonId: 'DNI',
            dischargedHospitalDescription: 'Hazelwood House',
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
    cy.signIn()
  })

  it('should show search restricted patient', () => {
    cy.task('stubSignIn', { roles: ['SEARCH_RESTRICTED_PATIENT'] })
    const page = Page.verifyOnPage(HomePage)

    page.searchRestrictedPatient().click()
    Page.verifyOnPage(RestrictedPatientSearchPage)
  })

  it('Shows Restricted Patients', () => {
    cy.visit('/view-restricted-patients/search-for-patient')
    const restrictedPatientSearchPage = Page.verifyOnPage(RestrictedPatientSearchPage)

    restrictedPatientSearchPage.searchTerm().type('A1234AA')
    restrictedPatientSearchPage.submit().click()

    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/view-restricted-patients')
      expect(loc.search).to.eq('?searchTerm=A1234AA')
    })

    const viewRestrictedPatientsPage = Page.verifyOnPage(ViewRestrictedPatientsPage)

    viewRestrictedPatientsPage
      .resultsTable()
      .find('tr')
      .should($tableRows => {
        expect($tableRows).to.have.length(2) // 1 result plus table header

        const offenders = Array.from($tableRows).map($row => toOffender($row.cells))

        expect(offenders[1].name).to.contain('Smith, John')
        expect(offenders[1].prisonerNumber).to.eq('A1234AA')
        expect(offenders[1].location).to.eq('Hazelwood House')
        expect(offenders[1].supportingPrison).to.eq('Doncaster')
        expect(offenders[1].addACaseNoteLink).to.contain('Add a case note')
      })
    viewRestrictedPatientsPage.viewPrisonerProfile().should('have.attr', 'href').and('include', '/prisoner/A1234AA')
    viewRestrictedPatientsPage
      .addCaseNotes()
      .should('have.attr', 'href')
      .and('include', '/prisoner/A1234AA/add-case-note')
  })

  describe('View restricted patients results page', () => {
    it('Displays no results message', () => {
      cy.task('stubRestrictedPatientSearch', {
        results: {
          content: [],
        },
      })

      cy.visit('/view-restricted-patients/search-for-patient')
      const restrictedPatientSearchPage = Page.verifyOnPage(RestrictedPatientSearchPage)

      restrictedPatientSearchPage.searchTerm().type('A1234AA')
      restrictedPatientSearchPage.submit().click()

      const viewRestrictedPatientsPage = Page.verifyOnPage(ViewRestrictedPatientsPage)

      viewRestrictedPatientsPage.resultsTable().should('not.exist')
      viewRestrictedPatientsPage
        .noResultsMessage()
        .should('contain', 'There are no results for the details you have entered.')
    })

    it('Handles search again validation', () => {
      cy.task('stubRestrictedPatientSearch', {
        results: {
          content: [],
        },
      })

      cy.visit('/view-restricted-patients/search-for-patient')
      const restrictedPatientSearchPage = Page.verifyOnPage(RestrictedPatientSearchPage)

      restrictedPatientSearchPage.searchTerm().type('A1234AA')
      restrictedPatientSearchPage.submit().click()

      const viewRestrictedPatientsPage = Page.verifyOnPage(ViewRestrictedPatientsPage)

      viewRestrictedPatientsPage.searchTerm().clear()
      viewRestrictedPatientsPage.submit().click()

      viewRestrictedPatientsPage
        .errorSummaryList()
        .find('li')
        .then($errors => {
          expect($errors.get(0).innerText).to.contain('Enter a restricted patient’s name or prison number')
        })
    })
  })
})
