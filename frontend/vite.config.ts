/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Credenciais fictícias para o cliente Supabase não falhar ao carregar nos testes.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    // Testes E2E (Playwright) ficam em e2e/ e não são executados pelo vitest.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
