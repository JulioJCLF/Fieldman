import type { Config } from 'tailwindcss';

/**
 * Design system "Tactical Precision UI" (ver design.md): base clara
 * profissional, primária laranja para ações críticas e cinzas executivos
 * para hierarquia. Tipografia Inter, cantos arredondados.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f1fbff',
          dim: '#d1dce0',
          bright: '#f1fbff',
          lowest: '#ffffff',
          low: '#eaf5fa',
          container: '#e1eaef',
          high: '#d7e1e6',
          highest: '#ced7dc',
        },
        'on-surface': {
          DEFAULT: '#191c1e',
          variant: '#40484c',
        },
        outline: {
          DEFAULT: '#70787d',
          variant: '#c0c8cd',
        },
        primary: {
          DEFAULT: '#ff5e00',
          container: '#ffdbca',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#331200',
        },
        secondary: {
          DEFAULT: '#516069',
          container: '#d4e4ee',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#0d1d25',
        },
        error: {
          DEFAULT: '#ba1a1a',
        },
        'on-error': {
          DEFAULT: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 8px 24px rgba(25, 28, 30, 0.08)',
        'panel-lg': '0 16px 40px rgba(25, 28, 30, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
