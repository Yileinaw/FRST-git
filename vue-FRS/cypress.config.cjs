const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  component: {
    // Match component test files located next to components
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',

    devServer: {
      framework: 'vue',
      bundler: 'vite',
      // You might need to explicitly pass Vite config if auto-detection fails
      // viteConfig: require('./vite.config.js') // Adjust path if needed
    },
    // Optional: setupNodeEvents for component tests if needed
    // setupNodeEvents(on, config) {
    //   // ...
    // },
  },
});
