/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  // Add Vitest configuration
  test: {
    globals: true, // Make Vitest APIs (describe, it, expect) globally available
    environment: 'happy-dom', // Use happy-dom to simulate DOM environment for component testing
    // Optional: Add setup file for global mocks or configurations
    // setupFiles: './tests/setup.ts',
    // Optional: Configure coverage reporting
    // coverage: {
    //   provider: 'v8', // or 'istanbul'
    //   reporter: ['text', 'json', 'html'],
    // },
  }
})
