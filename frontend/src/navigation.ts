export type AppView =
  | 'home'
  | 'reception'
  | 'games'
  | 'history'
  | 'snackbar'
  | 'store'
  | 'analytics'
  | 'users';

export interface NavItem {
  view: AppView;
  label: string;
}

/** Itens exibidos na barra de navegação principal, na ordem. */
export const NAV_ITEMS: NavItem[] = [
  { view: 'home', label: 'Início' },
  { view: 'reception', label: 'Recepção' },
  { view: 'games', label: 'Jogos' },
  { view: 'history', label: 'Histórico' },
  { view: 'snackbar', label: 'Lanchonete' },
  { view: 'store', label: 'Loja' },
  { view: 'analytics', label: 'Gestão' },
  { view: 'users', label: 'Usuários' },
];
