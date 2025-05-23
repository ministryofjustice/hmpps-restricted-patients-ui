context('Healthcheck', () => {
  context('Healthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubAuthPing')
      cy.task('stubManageUsersPing')
      cy.task('stubTokenVerificationPing')
      cy.task('stubSearchPing')
      cy.task('stubPrisonApiPing')
      cy.task('stubRestrictedPatientApiPing')
    })

    it('Health check page is visible and UP', () => {
      cy.request('/health').its('body.status').should('equal', 'UP')
    })

    it('All dependant APIs are healthy', () => {
      cy.request('/health').then(response => {
        expect(response.body.components).to.deep.eq({
          hmppsAuth: { status: 'UP' },
          manageUsersApi: { status: 'UP' },
          prisonerSearch: { status: 'UP' },
          tokenVerification: { status: 'UP' },
          prisonApi: { status: 'UP' },
          restrictedPatientApi: { status: 'UP' },
        })
      })
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })

    it('Info is visible', () => {
      cy.request('/info').its('body').should('exist')
    })
  })

  context('Some unhealthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubAuthPing')
      cy.task('stubManageUsersPing')
      cy.task('stubTokenVerificationPing', 500)
      cy.task('stubSearchPing', 500)
      cy.task('stubPrisonApiPing', 500)
      cy.task('stubRestrictedPatientApiPing', 500)
    })

    it('Reports correctly when token verification down', () => {
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.components.hmppsAuth.status).to.equal('UP')
        expect(response.body.components.manageUsersApi.status).to.equal('UP')
        expect(response.body.components.tokenVerification.status).to.equal('DOWN')
        expect(response.body.components.tokenVerification.details).to.contain({ status: 500, attempts: 3 })
      })
    })

    it('Health check page is visible and DOWN', () => {
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).its('body.status').should('equal', 'DOWN')
    })

    it('Some dependant APIs are unhealthy', () => {
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.components.hmppsAuth.status).to.equal('UP')
        expect(response.body.components.prisonerSearch.status).to.equal('DOWN')
        expect(response.body.components.prisonerSearch.details).to.contain({ status: 500, attempts: 3 })
        expect(response.body.components.tokenVerification.status).to.equal('DOWN')
        expect(response.body.components.tokenVerification.details).to.contain({ status: 500, attempts: 3 })
        expect(response.body.components.prisonApi.status).to.equal('DOWN')
        expect(response.body.components.restrictedPatientApi.status).to.equal('DOWN')
      })
    })
  })
})
