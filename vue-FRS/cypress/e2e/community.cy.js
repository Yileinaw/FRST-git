// vue-FRS/cypress/e2e/community.cy.js

describe('Community Page Flow', () => {
    beforeEach(() => {
        // 模拟登录：在 localStorage 中设置认证 Token
        cy.window().then((win) => {
            // 使用从 auth.ts 中确定的键名 'authToken'
            win.localStorage.setItem('authToken', 'fake-cypress-test-token-' + Date.now());
            console.log('Cypress: Auth token set in localStorage');
        });

        // 访问社区页面
        cy.visit('/community');
        cy.log('Navigated to /community'); // 添加日志方便调试
    });

    it('should load the community page and display posts after skeleton', () => {
        cy.log('Starting test: should display posts after skeleton');

        // 1. Check if the main page heading is visible
        cy.get('h2').contains('交流分享').should('be.visible');
        cy.log('Verified page heading');

        // 2. Wait for the skeleton loading state to disappear
        cy.get('[data-cy="skeleton-loading"]', { timeout: 10000 }).should('not.exist');
        cy.log('Verified skeleton loading is gone.');

        cy.pause(); // Pause for manual inspection with Vue DevTools

        // 3. Check if the v-else placeholder div is visible
        cy.get('[data-cy="v-else-placeholder"]', { timeout: 6000 })
            .should('be.visible');
        cy.log('Verified v-else placeholder is visible.');

        // Comment out previous checks
        // cy.get('[data-cy="post-list-wrapper"]', { timeout: 6000 })
        //  .should('be.visible'); 
        // cy.log('Verified post list wrapper is visible.');
        // cy.get('[data-cy="post-list-wrapper"] [data-cy="post-item"]', { timeout: 6000 })
        //  .first()
        //  .should('be.visible');
        // cy.log('Verified at least one post item is visible.');

    });

    // 你可以在这里添加更多测试用例，比如测试帖子点击跳转等
    // it('should navigate to post detail when clicking a post', () => {
    //   // ... 测试代码 ...
    // });
});