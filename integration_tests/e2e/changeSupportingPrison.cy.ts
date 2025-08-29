import PatientSearchPage from '../pages/changeSupportingPrison/patientSearch.page'
import PatientSelectPage from '../pages/changeSupportingPrison/patientSelect.page'
import SelectPrisonPage from '../pages/changeSupportingPrison/selectPrison.page'
import ChangePrisonConfirmationPage from '../pages/changeSupportingPrison/changePrisonConfirmation.page'
import ChangePrisonCompletedPage from '../pages/changeSupportingPrison/changePrisonCompleted.page'
import Page from '../pages/page'
import HomePage from '../pages/home.page'

const toOffender = $cell => ({
  name: $cell[1].textContent,
  prisonerNumber: $cell[2].textContent,
  locationDescription: $cell[3].textContent,
  supportingPrison: $cell[4].textContent,
  changeSupportingPrisonLink: $cell[5].textContent,
})

context('Change supporting prison', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['RESTRICTED_PATIENT_MIGRATION'] })
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
          description: 'HMP Moorland',
          longDescription: 'Moorland (HMP)',
          agencyType: 'INST',
          active: true,
        },
      ],
    })
    cy.task('stubGetAgencyDetails', {
      id: 'MDI',
      response: {
        agencyId: 'MDI',
        description: 'HMP Moorland',
        longDescription: 'Moorland (HMP)',
        agencyType: 'INST',
        active: true,
      },
    })
    cy.task('stubChangeSupportingPrison', {
      status: 200,
      response: {
        restrictedPatient: {
          supportingPrison: 'MDI',
        },
      },
    })
    cy.task('stubGetPrisonerDetails', {
      prisonerNumber: 'A1234AA',
      response: {
        offenderNo: 'A1234AA',
        firstName: 'JOHN',
        lastName: 'SMITH',
        locationDescription: 'Bartholemew Court',
        categoryCode: 'C',
        alerts: [
          { active: true, alertType: 'T', alertCode: 'TCPA' },
          { active: true, alertType: 'X', alertCode: 'XCU' },
        ],
      },
    })
    cy.signIn()
  })

  it('should display the change supporting prison from the HomePage', () => {
    const page = Page.verifyOnPage(HomePage)
    page.changeSupportingPrison().click()
    Page.verifyOnPage(PatientSearchPage)
  })

  it('Completes a change supporting prison journey', () => {
    cy.visit('/change-supporting-prison/search-for-patient')
    const patientSearchPage = Page.verifyOnPage(PatientSearchPage)

    patientSearchPage.searchTerm().type('A1234AA')
    patientSearchPage.submit().click()

    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/change-supporting-prison/select-patient')
      expect(loc.search).to.eq('?searchTerm=A1234AA')
    })

    const patientSelectPage = Page.verifyOnPage(PatientSelectPage)

    patientSelectPage
      .resultsTable()
      .find('tr')
      .should($tableRows => {
        expect($tableRows).to.have.length(2) // 1 result plus table header

        const offenders = Array.from($tableRows).map($row => toOffender($row.cells))

        expect(offenders[1].name).to.contain('Smith, John')
        expect(offenders[1].prisonerNumber).to.eq('A1234AA')
        expect(offenders[1].locationDescription).to.eq('Sheffield Hospital')
        expect(offenders[1].supportingPrison).to.contain('HMP Moorland')
        expect(offenders[1].changeSupportingPrisonLink).to.contain('Change supporting prison')
      })
    patientSelectPage.changeSupportingPrisonLink().click()

    const selectPrisonPage = Page.verifyOnPageWithTitleParam(SelectPrisonPage, 'John Smith')

    selectPrisonPage.prisonerName().should('contain', 'Smith, John')
    selectPrisonPage.prisonerNumber().should('contain', 'A1234AA')
    selectPrisonPage.prisonerLocation().should('contain', 'Sheffield Hospital')
    selectPrisonPage.prisonerSupportingPrison().should('contain', 'HMP Moorland')

    selectPrisonPage.prison().type('Moor')
    selectPrisonPage.submit().click()

    const confirmationPage = Page.verifyOnPageWithTwoTitleParams(
      ChangePrisonConfirmationPage,
      'John Smith',
      'HMP Moorland',
    )

    confirmationPage.confirm().click()

    const completedPage = Page.verifyOnPageWithTitleParam(ChangePrisonCompletedPage, 'John Smith')
    completedPage.informationMessage().should('contain', 'supporting prison is now HMP Moorland')
    completedPage.finish().click()

    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/')
    })
  })

  describe('Select patient results page', () => {
    it('Displays no results message', () => {
      cy.task('stubRestrictedPatientSearch', {
        query: {
          equalToJson: {
            prisonerIdentifier: 'A1234AA',
            prisonIds: ['OUT'],
            includeAliases: false,
          },
        },
        results: {
          content: [],
        },
      })

      cy.visit('/change-supporting-prison/search-for-patient')
      const patientSearchPage = Page.verifyOnPage(PatientSearchPage)

      patientSearchPage.searchTerm().type('A1234AA')
      patientSearchPage.submit().click()

      const patientSelectPage = Page.verifyOnPage(PatientSelectPage)

      patientSelectPage.resultsTable().should('not.exist')
      patientSelectPage.noResultsMessage().should('contain', 'There are no results for the details you have entered.')
    })

    it('Handles search again validation', () => {
      cy.visit('/change-supporting-prison/search-for-patient')
      const patientSearchPage = Page.verifyOnPage(PatientSearchPage)

      patientSearchPage.searchTerm().type('A1234AA')
      patientSearchPage.submit().click()

      const patientSelectPage = Page.verifyOnPage(PatientSelectPage)

      patientSelectPage.searchTerm().clear()
      patientSelectPage.submit().click()

      patientSelectPage
        .errorSummaryList()
        .find('li')
        .then($errors => {
          expect($errors.get(0).innerText).to.contain('Enter a restricted patient’s name or prison number')
        })
    })
  })
})
