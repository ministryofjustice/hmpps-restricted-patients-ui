import PrisonerSearchPage from '../pages/movePrisoner/movePrisonerSearch.page'
import PrisonerSelectPage from '../pages/movePrisoner/movePrisonerSelect.page'
import MovePrisonerSelectHospitalPage from '../pages/movePrisoner/movePrisonerSelectHospital.page'
import MovePrisonerConfirmationPage from '../pages/movePrisoner/movePrisonerConfirmation.page'
import MovePrisonerCompletedPage from '../pages/movePrisoner/movePrisonerCompleted.page'
import ErrorPage from '../pages/error.page'
import HomePage from '../pages/home.page'
import Page from '../pages/page'

const toOffender = $cell => ({
  name: $cell[1].textContent,
  prisonerNumber: $cell[2].textContent,
  cellLocation: $cell[3].textContent,
  alerts: $cell[4].textContent,
  moveHospitalLink: $cell[5].textContent,
})

context('Move prisoner', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['TRANSFER_RESTRICTED_PATIENT'] })
    cy.task('stubManageUser')
    cy.task('stubFrontendComponents')
    cy.task('stubSearch')
    cy.task('stubGetAgenciesByType', {
      type: 'HOSPITAL',
      response: [
        {
          agencyId: 'SHEFF',
          description: 'Sheffield Hospital',
          longDescription: 'Sheffield Teaching Hospital',
          agencyType: 'HOSP',
          active: true,
        },
      ],
    })
    cy.task('stubGetAgenciesByType', {
      type: 'HSHOSP',
      response: [
        {
          agencyId: 'ROTH',
          description: 'Rotherham Hospital',
          longDescription: 'Rotherham General Hospital',
          agencyType: 'HSHOSP',
          active: true,
        },
      ],
    })
    cy.task('stubGetAgencyDetails', {
      id: 'SHEFF',
      response: {
        agencyId: 'SHEFF',
        description: 'Sheffield Hospital',
        longDescription: 'Sheffield Teaching Hospital',
        agencyType: 'HOSP',
        active: true,
      },
    })
    cy.task('stubDischargeToHospital', {
      status: 200,
      response: {
        restrictivePatient: {
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
        assignedLivingUnit: { description: '1-2-015' },
        categoryCode: 'C',
        alerts: [
          { active: true, alertType: 'T', alertCode: 'TCPA' },
          { active: true, alertType: 'X', alertCode: 'XCU' },
          { active: true, alertType: 'X', alertCode: 'XER' },
          { active: true, alertType: 'R', alertCode: 'RTP' },
        ],
      },
    })
    cy.signIn()
  })

  it('should display the search for prisoner page from the HomePage', () => {
    const page = Page.verifyOnPage(HomePage)
    page.moveToHospital().click()
    Page.verifyOnPage(PrisonerSearchPage)
  })

  it('Completes a move prisoner journey', () => {
    cy.visit('/move-to-hospital/search-for-prisoner')
    const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)

    prisonerSearchPage.searchTerm().type('A1234AA')
    prisonerSearchPage.submit().click()

    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/move-to-hospital/select-prisoner')
      expect(loc.search).to.eq('?searchTerm=A1234AA')
    })

    const prisonerSelectPage = Page.verifyOnPage(PrisonerSelectPage)

    prisonerSelectPage
      .resultsTable()
      .find('tr')
      .should($tableRows => {
        expect($tableRows).to.have.length(2) // 1 result plus table header
        const offenders = Array.from($tableRows).map($row => toOffender($row.cells))

        expect(offenders[1].name).to.contain('Smith, John')
        expect(offenders[1].prisonerNumber).to.eq('A1234AA')
        expect(offenders[1].cellLocation).to.eq('1-2-015')
        expect(offenders[1].alerts).to.contain('Controlled unlock')
        expect(offenders[1].moveHospitalLink).to.contain('Move to a hospital')
      })
    prisonerSelectPage.moveToHospitalLink().click()

    const movePrisonerSelectHospitalPage = Page.verifyOnPageWithTitleParam(MovePrisonerSelectHospitalPage, 'John Smith')

    movePrisonerSelectHospitalPage.prisonerName().should('contain', 'Smith, John')
    movePrisonerSelectHospitalPage.prisonerNumber().should('contain', 'A1234AA')
    movePrisonerSelectHospitalPage.prisonerCell().should('contain', '1-2-015')
    movePrisonerSelectHospitalPage.prisonerAlerts().should('contain', 'Controlled unlock')

    movePrisonerSelectHospitalPage.hospital().type('Sheff')
    movePrisonerSelectHospitalPage.submit().click()

    const movePrisonerConfirmationPage = Page.verifyOnPageWithTwoTitleParams(
      MovePrisonerConfirmationPage,
      'John Smith',
      'Sheffield Hospital',
    )
    movePrisonerConfirmationPage.confirm().click()

    const movePrisonerCompletedPage = Page.verifyOnPageWithTwoTitleParams(
      MovePrisonerCompletedPage,
      'John Smith',
      'Sheffield Hospital',
    )

    movePrisonerCompletedPage.finish().click()

    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/')
    })
  })

  describe('Select prisoner results page', () => {
    it('Displays no results message', () => {
      cy.task('stubSearch', { results: [] })

      cy.visit('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)

      prisonerSearchPage.searchTerm().type('A1234AA')
      prisonerSearchPage.submit().click()

      const prisonerSelectPage = Page.verifyOnPage(PrisonerSelectPage)

      prisonerSelectPage.resultsTable().should('not.exist')
      prisonerSelectPage.noResultsMessage().should('contain', 'There are no results for the details you have entered.')
    })

    it('Handles search again validation', () => {
      cy.visit('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)

      prisonerSearchPage.searchTerm().type('A1234AA')
      prisonerSearchPage.submit().click()

      const prisonerSelectPage = Page.verifyOnPage(PrisonerSelectPage)

      prisonerSelectPage.searchTerm().clear()
      prisonerSelectPage.submit().click()

      prisonerSelectPage
        .errorSummaryList()
        .find('li')
        .then($errors => {
          expect($errors.get(0).innerText).to.contain('Enter a prisoner’s name or number')
        })
    })
  })

  describe('Select hospital page', () => {
    it('Handles select hospital validation', () => {
      cy.visit('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)

      prisonerSearchPage.searchTerm().type('A1234AA')
      prisonerSearchPage.submit().click()

      const prisonerSelectPage = Page.verifyOnPage(PrisonerSelectPage)

      prisonerSelectPage.moveToHospitalLink().click()

      const movePrisonerSelectHospitalPage = Page.verifyOnPageWithTitleParam(
        MovePrisonerSelectHospitalPage,
        'John Smith',
      )
      movePrisonerSelectHospitalPage.submit().click()

      movePrisonerSelectHospitalPage
        .errorSummaryList()
        .find('li')
        .then($errors => {
          expect($errors.get(0).innerText).to.contain('Enter a hospital')
        })
    })

    it('Show select hospital validation after entering, selecting and then deleting a hospital selection', () => {
      cy.visit('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)

      prisonerSearchPage.searchTerm().type('A1234AA')
      prisonerSearchPage.submit().click()

      const prisonerSelectPage = Page.verifyOnPage(PrisonerSelectPage)

      prisonerSelectPage.moveToHospitalLink().click()

      const movePrisonerSelectHospitalPage = Page.verifyOnPageWithTitleParam(
        MovePrisonerSelectHospitalPage,
        'John Smith',
      )

      movePrisonerSelectHospitalPage.hospital().type('Sheff{enter}').clear()
      movePrisonerSelectHospitalPage.submit().click()

      movePrisonerSelectHospitalPage
        .errorSummaryList()
        .find('li')
        .then($errors => {
          expect($errors.get(0).innerText).to.contain('Enter a hospital')
        })
    })

    it('Redirects back to search results when clicking cancel', () => {
      cy.visit('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)

      prisonerSearchPage.searchTerm().type('A1234AA')
      prisonerSearchPage.submit().click()

      const prisonerSelectPage = Page.verifyOnPage(PrisonerSelectPage)

      prisonerSelectPage.moveToHospitalLink().click()

      const movePrisonerSelectHospitalPage = Page.verifyOnPageWithTitleParam(
        MovePrisonerSelectHospitalPage,
        'John Smith',
      )

      movePrisonerSelectHospitalPage.cancel().click()

      cy.location().should(loc => {
        expect(loc.pathname).to.eq('/move-to-hospital/select-prisoner')
        expect(loc.search).to.eq('?searchTerm=A1234AA')
      })
    })
  })

  describe('Confirm move page', () => {
    it('Redirects back to search results when clicking cancel', () => {
      cy.visit('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)

      prisonerSearchPage.searchTerm().type('A1234AA')
      prisonerSearchPage.submit().click()

      const prisonerSelectPage = Page.verifyOnPage(PrisonerSelectPage)

      prisonerSelectPage.moveToHospitalLink().click()

      const movePrisonerSelectHospitalPage = Page.verifyOnPageWithTitleParam(
        MovePrisonerSelectHospitalPage,
        'John Smith',
      )
      movePrisonerSelectHospitalPage.hospital().type('Sheff')
      movePrisonerSelectHospitalPage.submit().click()

      const movePrisonerConfirmationPage = Page.verifyOnPageWithTwoTitleParams(
        MovePrisonerConfirmationPage,
        'John Smith',
        'Sheffield Hospital',
      )
      movePrisonerConfirmationPage.cancel().click()

      cy.location().should(loc => {
        expect(loc.pathname).to.eq('/move-to-hospital/select-prisoner')
        expect(loc.search).to.eq('?searchTerm=A1234AA')
      })
    })

    it('Shows error page that continues to the search results when an error occurs during a move', () => {
      cy.task('stubDischargeToHospital', {
        status: 500,
        response: {
          error: 'Error during move',
        },
      })

      cy.visit('/move-to-hospital/search-for-prisoner')
      const prisonerSearchPage = Page.verifyOnPage(PrisonerSearchPage)

      prisonerSearchPage.searchTerm().type('A1234AA')
      prisonerSearchPage.submit().click()

      const prisonerSelectPage = Page.verifyOnPage(PrisonerSelectPage)

      prisonerSelectPage.moveToHospitalLink().click()

      const movePrisonerSelectHospitalPage = Page.verifyOnPageWithTitleParam(
        MovePrisonerSelectHospitalPage,
        'John Smith',
      )

      movePrisonerSelectHospitalPage.hospital().type('Sheff')
      movePrisonerSelectHospitalPage.submit().click()

      const movePrisonerConfirmationPage = Page.verifyOnPageWithTwoTitleParams(
        MovePrisonerConfirmationPage,
        'John Smith',
        'Sheffield Hospital',
      )

      movePrisonerConfirmationPage.confirm().click()

      const errorPage = Page.verifyOnPageWithTitleParam(ErrorPage, 'Internal Server Error')
      errorPage.continue().click()

      cy.location().should(loc => {
        expect(loc.pathname).to.eq('/move-to-hospital/select-prisoner')
        expect(loc.search).to.eq('?searchTerm=A1234AA')
      })
    })
  })
})
