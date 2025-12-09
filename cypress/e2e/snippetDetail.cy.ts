describe('Add snippet tests', () => {
  const AUTH0_USERNAME = Cypress.env('AUTH0_USERNAME')
  const AUTH0_PASSWORD = Cypress.env('AUTH0_PASSWORD')

  beforeEach(() => {
     cy.loginToAuth0(
        AUTH0_USERNAME,
        AUTH0_PASSWORD
     )
    cy.intercept('GET', '/api/snippet-service/snippets-management/*').as("getSnippetById")
    cy.intercept('GET', '/api/snippet-service/snippets-management?*').as("getSnippets")

    cy.visit("/")

    cy.wait("@getSnippets")
    cy.get('.MuiTableBody-root > :nth-child(1) > :nth-child(1)').click();
  })

  it('Can share a snippet ', () => {
    cy.intercept('GET', '/api/snippet-service/snippets-sharing*').as('getUsers');
    cy.intercept('POST', '/api/snippet-service/snippets-sharing/share').as('shareSnippet');

    cy.get('[aria-label="Share"]').click();

    cy.contains('Share your snippet').should('be.visible');
    cy.get('input[type="text"]').last().type('test');
    cy.wait('@getUsers', { timeout: 10000 });
    cy.get('[role="option"]').first().click();
    cy.contains('button', 'Save permissions').click();

    cy.wait('@shareSnippet');
  })

  it('Can run snippets', function() {
    cy.get('[data-testid="PlayArrowIcon"]').click();
    cy.get('.css-1hpabnv > .MuiBox-root > div > .npm__react-simple-code-editor__textarea').should("have.length.greaterThan",0);
  });

  it('Can format snippets', function() {
    cy.get('[data-testid="ReadMoreIcon"] > path').click();
  });

  it('Can save snippets', function() {
    cy.get('.css-10egq61 > .MuiBox-root > div > .npm__react-simple-code-editor__textarea').click();
    cy.get('.css-10egq61 > .MuiBox-root > div > .npm__react-simple-code-editor__textarea').type("Some new line");
    cy.get('[data-testid="SaveIcon"] > path').click();
  });

  it('Can delete snippets', function() {
    cy.intercept('DELETE', '/api/snippet-service/snippets-management/*').as('deleteSnippet');

    cy.get('[data-testid="DeleteIcon"] > path').click();

    cy.contains('Are you sure you want to delete this snippet?').should('be.visible');
    cy.contains('button', 'Delete').click();
    cy.wait('@deleteSnippet');

    cy.url().should('not.include', '/snippet/');
  });
})
