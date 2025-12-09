describe('Protected routes test', () => {
  const AUTH0_USERNAME = Cypress.env('AUTH0_USERNAME')
  const AUTH0_PASSWORD = Cypress.env('AUTH0_PASSWORD')

  it('should redirect to Auth0 login when accessing a protected route unauthenticated', () => {
    cy.visit('/');

    cy.origin(Cypress.env('auth0_domain'), () => {
      cy.get('input#username', { timeout: 15000 }).should('be.visible');
    });
  });

  it('should not redirect to login when the user is already authenticated', () => {
    cy.loginToAuth0(
        AUTH0_USERNAME,
        AUTH0_PASSWORD
    )

    cy.visit('/');

    cy.wait(2000)

    cy.url().should('not.include', 'auth0.com');
    cy.url().should('include', 'localhost');

    cy.get('.MuiTypography-h6').should('have.text', 'Printscript');
  });

})
