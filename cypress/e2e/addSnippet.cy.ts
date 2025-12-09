describe('Add snippet tests', () => {
  const AUTH0_USERNAME = Cypress.env('AUTH0_USERNAME')
  const AUTH0_PASSWORD = Cypress.env('AUTH0_PASSWORD')

  beforeEach(() => {
    cy.loginToAuth0(
         AUTH0_USERNAME,
         AUTH0_PASSWORD
     )
  })
  it('Can add snippets manually', () => {
    cy.intercept('POST', '/api/snippet-service/snippets-management/editor').as('postRequest');
    cy.intercept('GET', '/api/snippet-service/snippets-management*').as('getSnippets');

    cy.visit("/")

    cy.wait('@getSnippets')

    /* ==== Generated with Cypress Studio ==== */
    cy.get('.css-9jay18 > .MuiButton-root').click();
    cy.get('.MuiList-root > [tabindex="0"]').click();
    cy.get('#name').type('Some snippet name');
    cy.get('#demo-simple-select').click()
    cy.get('[data-testid="menu-option-printscript"]').click()

    cy.get('[data-testid="add-snippet-code-editor"]').click();
    cy.get('[data-testid="add-snippet-code-editor"]').type(`const snippet: string = "some snippet"; \n println(snippet);`);
    cy.get('[data-testid="SaveIcon"]').click({force: true});

    cy.wait('@postRequest').its('response.statusCode').should('eq', 200);
  })

  it('Can add snippets via file', () => {
    cy.intercept('POST', '/api/snippet-service/snippets-management/editor').as('postRequest');
    cy.intercept('GET', '/api/snippet-service/snippets-management*').as('getSnippets');

    cy.visit("/")

    cy.wait('@getSnippets')

    /* ==== Generated with Cypress Studio ==== */
    cy.get('[data-testid="upload-file-input"').selectFile("cypress/fixtures/example_ps.ps", {force: true})

    cy.get('[data-testid="SaveIcon"]', {timeout: 10000}).should('be.visible')
    cy.get('[data-testid="SaveIcon"]').click();

    cy.wait('@postRequest').its('response.statusCode').should('eq', 200);
  })
})
