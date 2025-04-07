describe('Login Flow', () => {
  beforeEach(() => {
    // Visit the login page before each test in this block
    cy.visit('/auth/login'); // Assuming this is the correct login route
  });

  it('should display login form elements', () => {
    // Basic check to ensure elements are present
    cy.get('[data-cy="login-username"]').should('be.visible');
    cy.get('[data-cy="login-password"]').should('be.visible');
    cy.get('[data-cy="login-submit"]').should('be.visible');
  });

  it('should allow a user to log in successfully', () => {
    // --- Test Credentials (Replace with actual test user if needed) ---
    const username = 'testuser';
    const password = 'password123';
    // ------------------------------------------------------------------

    // Find the username input, type the username
    cy.get('[data-cy="login-username"]')
      .type(username)
      .should('have.value', username);

    // Find the password input, type the password
    cy.get('[data-cy="login-password"]')
      .type(password)
      .should('have.value', password);

    // Find the login button and click it
    cy.get('[data-cy="login-submit"]').click();

    // --- Assertions after login ---
    // 1. Check if the URL changed to the homepage (or dashboard)
    cy.url().should('eq', Cypress.config().baseUrl + '/'); // Assumes redirect to homepage

    // 2. (Optional but recommended) Check for an element indicating successful login
    //    Example: Check if a user avatar or logout button exists in the header
    // cy.get('[data-cy="user-avatar"]').should('be.visible');
    // cy.get('[data-cy="logout-button"]').should('be.visible');

    // 3. (Alternative) Check if the login page elements are gone
    cy.get('[data-cy="login-username"]').should('not.exist');
  });

  // Optional: Add test for failed login
  it('should show an error message on failed login', () => {
    const invalidUsername = 'wronguser';
    const invalidPassword = 'wrongpassword';

    cy.get('[data-cy="login-username"]').type(invalidUsername);
    cy.get('[data-cy="login-password"]').type(invalidPassword);
    cy.get('[data-cy="login-submit"]').click();

    // Assert that an error message is shown
    // Adjust the selector based on how your app displays errors
    cy.get('.el-message--error').should('be.visible'); // Example using Element Plus message
    // cy.contains('用户名或密码错误').should('be.visible'); // Alternative: check for specific text

    // Assert that we are still on the login page
    cy.url().should('include', '/auth/login');
  });
});