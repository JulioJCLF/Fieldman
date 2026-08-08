import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },

  // Base para todo TypeScript.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Backend (Node.js).
  {
    files: ['backend/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Frontend (React + browser).
  {
    files: ['frontend/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Nossos efeitos de data-fetching definem `loading=true` de forma síncrona
      // antes da chamada à API — sincronização legítima com sistema externo, não
      // um efeito derivável. A render extra é intencional (spinner de carga).
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // Testes: afrouxa regras que atrapalham mocks/fixtures.
  {
    files: ['**/*.test.{ts,tsx}', '**/test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Regras compartilhadas.
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Desliga regras estilísticas conflitantes com o Prettier (deve vir por último).
  prettier,
);
