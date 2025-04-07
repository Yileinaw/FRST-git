// src/views/community/CommunityView.cy.ts
import { mount } from '@cypress/vue'; // <--- 导入 mount 函数
import CommunityView from '../CommunityView.vue'; // <--- 导入你要测试的组件

// Import Pinia and stores (adjust paths if necessary)
import { createPinia, type Pinia } from 'pinia';
// import { useAuthStore } from '@/store/modules/auth'; // Example if needed
// import { useUserStore } from '@/store/modules/user'; // Example if needed

// Import Router (adjust paths if necessary)
import { createRouter, createWebHistory, type Router } from 'vue-router';

// Import Element Plus (or necessary components)
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

describe('<CommunityView /> Component Test', () => {
    // Create fresh instances for each test
    let pinia: Pinia;
    let router: Router;

    beforeEach(() => {
        // Create a new Pinia instance
        pinia = createPinia();

        // Create a new Router instance (add routes if needed for internal navigation)
        router = createRouter({
            history: createWebHistory(),
            routes: [], // Add necessary routes if CommunityView uses <router-link> internally
        });

        // Initialize stores (optional, if needed for initial state)
        // const authStore = useAuthStore(pinia);
        // authStore.setToken('fake-test-token'); // Example: Set initial logged-in state
    });

    it('renders the post list container after loading', () => {
        // Mount the component with necessary plugins
        mount(CommunityView, {
            global: {
                plugins: [pinia, router, ElementPlus], // Provide Pinia, Router, ElementPlus
                stubs: { // Optional: Stub child components if needed
                    // 'PostList': true // Example: Stub the PostList component
                }
            }
        });

        // --- Assertions ---
        // Since fetchPosts runs on mount, it will likely show loading initially.
        // Wait for loading indicator (skeleton or mask) to disappear, then check container.

        // Wait for skeleton to disappear (based on our重构)
        cy.get('[data-cy="skeleton-loading"]', { timeout: 10000 }).should('not.exist');
        cy.log('Verified skeleton loading is gone.');

        // Assert container existence and visibility AFTER loading
        cy.get('[data-cy="post-list-container"]', { timeout: 6000 })
            .should('exist')
            .and('be.visible');
        cy.log('Container found and visible');

        // Now check for actual content (list items)
        cy.get('[data-cy="post-list-container"] [data-cy="post-item"]', { timeout: 6000 })
            .first()
            .should('be.visible');
        cy.log('Verified at least one post item is visible.');

    });

});