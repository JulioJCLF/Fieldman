---
name: Tactical Precision UI
colors:
  surface: '#f1fbff'
  surface-dim: '#d1dce0'
  surface-bright: '#f1fbff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eaf5fa'
  surface-container: '#e1eaef'
  surface-container-high: '#d7e1e6'
  surface-container-highest: '#ced7dc'
  on-surface: '#191c1e'
  on-surface-variant: '#40484c'
  outline: '#70787d'
  outline-variant: '#c0c8cd'
  primary: '#ff5e00'
  on-primary: '#ffffff'
  primary-container: '#ffdbca'
  on-primary-container: '#331200'
  secondary: '#516069'
  on-secondary: '#ffffff'
  secondary-container: '#d4e4ee'
  on-secondary-container: '#0d1d25'
  error: '#ba1a1a'
  on-error: '#ffffff'
typography:
  font-family: Inter, sans-serif
  display:
    large: 57px / 64px, 400
    medium: 45px / 52px, 400
    small: 36px / 44px, 400
  headline:
    large: 32px / 40px, 400
    medium: 28px / 36px, 400
    small: 24px / 32px, 400
  title:
    large: 22px / 28px, 400
    medium: 16px / 24px, 500
    small: 14px / 20px, 500
  label:
    large: 14px / 20px, 500
    medium: 12px / 16px, 500
    small: 11px / 16px, 500
  body:
    large: 16px / 24px, 400
    medium: 14px / 20px, 400
    small: 12px / 16px, 400
spacing:
  margin-desktop: 24px
  margin-mobile: 16px
  gutter: 16px
roundness:
  none: 0px
  small: 4px
  medium: 8px
  large: 12px
  full: 9999px
---

# Tactical Precision UI - Design System

Este sistema de design foi criado para o projeto **Tactical Control**, focando em uma estética "Clean Tactical". Ele utiliza uma base clara e profissional com acentos em laranja vibrante para ações críticas e cinzas executivos para hierarquia de informação.

## Princípios de Design

1. **Clareza Operacional**: Interfaces limpas que priorizam a leitura rápida de dados financeiros e status de jogadores.
2. **Estética Tática Limpa**: Evita o excesso de texturas ou "camuflagem", optando por componentes modernos (ShadUI) e tipografia Inter.
3. **Foco em Ação**: Uso estratégico da cor primária (#FF5E00) para CTAs importantes como "Check-in" e "Start Match".

## Componentes Principais

- **Cards**: Bordas suaves (ROUND_FOUR) e superfícies claras para agrupar informações relacionadas.
- **Tabelas**: Estrutura simplificada para listagem de jogadores e faturamento.
- **Badges**: Indicadores de status (Pago, Pendente, Ativo) com cores semânticas claras.
- **Inputs**: Campos de formulário com rótulos precisos, incluindo suporte para campos obrigatórios (CPF).

## Notas de Implementação
O sistema foi projetado para ser implementado utilizando Tailwind CSS e componentes baseados em Radix UI/Shadcn, garantindo acessibilidade e robustez.
