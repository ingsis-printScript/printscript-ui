describe('Home', () => {
  const AUTH0_USERNAME = Cypress.env('AUTH0_USERNAME')
  const AUTH0_PASSWORD = Cypress.env('AUTH0_PASSWORD')
  const FRONTEND_URL = Cypress.config('baseUrl') || 'http://localhost:5173'

  beforeEach(() => {
     cy.loginToAuth0(
         AUTH0_USERNAME,
         AUTH0_PASSWORD
     )
  })
  it('Renders home', () => {
    cy.intercept('GET', '/api/snippet-service/snippets-management*').as('getSnippets');
    cy.intercept('GET', '/api/snippet-service/snippets-management/config/filetypes').as('getFileTypes');

    cy.visit(FRONTEND_URL)

    cy.wait('@getSnippets');
    cy.wait('@getFileTypes');

    /* ==== Generated with Cypress Studio ==== */
    cy.get('.MuiTypography-h6', { timeout: 10000 }).should('have.text', 'Printscript');
    cy.get('.MuiBox-root > .MuiInputBase-root > .MuiInputBase-input').should('be.visible');
    cy.get('.css-9jay18 > .MuiButton-root').should('be.visible');
    cy.get('.css-jie5ja').click();
    /* ==== End Cypress Studio ==== */
  })

  // You need to have at least 1 snippet in your DB for this test to pass
  it('Renders the first snippets', () => {
    cy.intercept('GET', '/api/snippet-service/snippets-management*').as('getSnippets');

    cy.visit(FRONTEND_URL)

    cy.wait('@getSnippets')

    const first10Snippets = cy.get('[data-testid="snippet-row"]')

    first10Snippets.should('have.length.greaterThan', 0)

    first10Snippets.should('have.length.lessThan', 11)
  })

  it('Can create snippet and find snippets by name', () => {
    const snippetName = "Test name " + Date.now()

    cy.intercept('POST', '/api/snippet-service/snippets-management/editor').as('postSnippet');
    cy.intercept('GET', '/api/snippet-service/snippets-management*').as('getSnippets');

    cy.visit(FRONTEND_URL)
    cy.wait('@getSnippets');

    cy.get('.css-9jay18 > .MuiButton-root').click();
    cy.get('.MuiList-root > [tabindex="0"]').click();
    cy.get('#name').type(snippetName);
    cy.get('#demo-simple-select').click()
    cy.get('[data-testid="menu-option-printscript"]').click()
    cy.get('[data-testid="add-snippet-code-editor"]').click();
    cy.get('[data-testid="add-snippet-code-editor"]').type('println(1);');
    cy.get('[data-testid="SaveIcon"]').click({force: true});

    cy.wait('@postSnippet').its('response.statusCode').should('eq', 200);

    cy.get('input[type="text"]').first().clear();
    cy.get('input[type="text"]').first().type(snippetName + "{enter}");

    cy.wait("@getSnippets")
    cy.contains(snippetName).should('exist');
  })
})
