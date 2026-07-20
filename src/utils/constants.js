// Roles
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  REFEREE: 'referee',
};

export const ROLE_LABELS = {
  [ROLES.OWNER]: 'Proprietário',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.MANAGER]: 'Gerente',
  [ROLES.STAFF]: 'Equipe',
  [ROLES.REFEREE]: 'Árbitro',
};

export const ROLE_COLORS = {
  [ROLES.OWNER]: 'accent',
  [ROLES.ADMIN]: 'primary',
  [ROLES.MANAGER]: 'info',
  [ROLES.STAFF]: 'default',
  [ROLES.REFEREE]: 'warning',
};

// Permissions: action → resource → roles[]
export const PERMISSIONS = {
  create: {
    games: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    billing: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    equipment: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    expenses: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    finances: [ROLES.OWNER, ROLES.ADMIN],
    users: [ROLES.OWNER, ROLES.ADMIN],
  },
  read: {
    games: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.REFEREE],
    billing: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    equipment: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
    expenses: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    finances: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    analytics: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    users: [ROLES.OWNER, ROLES.ADMIN],
    settings: [ROLES.OWNER, ROLES.ADMIN],
    dashboard: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.REFEREE],
  },
  update: {
    games: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    billing: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    equipment: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    expenses: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER],
    finances: [ROLES.OWNER, ROLES.ADMIN],
    users: [ROLES.OWNER, ROLES.ADMIN],
    settings: [ROLES.OWNER, ROLES.ADMIN],
  },
  delete: {
    games: [ROLES.OWNER, ROLES.ADMIN],
    billing: [ROLES.OWNER, ROLES.ADMIN],
    equipment: [ROLES.OWNER, ROLES.ADMIN],
    expenses: [ROLES.OWNER, ROLES.ADMIN],
    finances: [ROLES.OWNER, ROLES.ADMIN],
    users: [ROLES.OWNER],
  },
  checkin: {
    games: [ROLES.OWNER, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.REFEREE],
  },
  manage_roles: {
    users: [ROLES.OWNER],
  },
};

// Game statuses
export const GAME_STATUS = {
  SCHEDULED: 'scheduled',
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const GAME_STATUS_LABELS = {
  [GAME_STATUS.SCHEDULED]: 'Agendado',
  [GAME_STATUS.OPEN]: 'Aberto para Inscrição',
  [GAME_STATUS.IN_PROGRESS]: 'Em Andamento',
  [GAME_STATUS.COMPLETED]: 'Concluído',
  [GAME_STATUS.CANCELLED]: 'Cancelado',
};

export const GAME_STATUS_COLORS = {
  [GAME_STATUS.SCHEDULED]: 'info',
  [GAME_STATUS.OPEN]: 'success',
  [GAME_STATUS.IN_PROGRESS]: 'warning',
  [GAME_STATUS.COMPLETED]: 'default',
  [GAME_STATUS.CANCELLED]: 'danger',
};

export const GAME_TYPES = {
  OPEN: 'open',
  CLOSED: 'closed',
};

export const GAME_TYPE_LABELS = {
  [GAME_TYPES.OPEN]: 'Jogo Aberto',
  [GAME_TYPES.CLOSED]: 'Jogo Fechado',
};

// Billing
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pendente',
  [PAYMENT_STATUS.PARTIAL]: 'Parcial',
  [PAYMENT_STATUS.PAID]: 'Pago',
  [PAYMENT_STATUS.OVERDUE]: 'Atrasado',
  [PAYMENT_STATUS.REFUNDED]: 'Reembolsado',
};

export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.PENDING]: 'warning',
  [PAYMENT_STATUS.PARTIAL]: 'info',
  [PAYMENT_STATUS.PAID]: 'success',
  [PAYMENT_STATUS.OVERDUE]: 'danger',
  [PAYMENT_STATUS.REFUNDED]: 'default',
};

export const PAYMENT_METHODS = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX', 'Transferência Bancária'];

// Equipment
export const EQUIPMENT_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
};

export const EQUIPMENT_STATUS_LABELS = {
  [EQUIPMENT_STATUS.AVAILABLE]: 'Disponível',
  [EQUIPMENT_STATUS.IN_USE]: 'Em Uso',
  [EQUIPMENT_STATUS.MAINTENANCE]: 'Manutenção',
  [EQUIPMENT_STATUS.RETIRED]: 'Aposentado',
};

export const EQUIPMENT_STATUS_COLORS = {
  [EQUIPMENT_STATUS.AVAILABLE]: 'success',
  [EQUIPMENT_STATUS.IN_USE]: 'info',
  [EQUIPMENT_STATUS.MAINTENANCE]: 'warning',
  [EQUIPMENT_STATUS.RETIRED]: 'default',
};

export const EQUIPMENT_CATEGORIES = [
  'Armas de Airsoft',
  'Máscaras e Óculos',
  'Coletes Táticos',
  'BBs e Munição',
  'Gás e CO2',
  'Granadas',
  'Rádios',
  'Baterias e Carregadores',
  'Equipamento de Proteção',
  'Acessórios',
];

export const EQUIPMENT_CONDITIONS = ['Novo', 'Bom', 'Regular', 'Precisa de Reparo', 'Aposentado'];

// Finance categories
export const EXPENSE_CATEGORIES = [
  'Compra de Equipamento',
  'Manutenção de Equipamento',
  'Salários da Equipe',
  'Utilidades',
  'Aluguel',
  'Marketing',
  'Seguro',
  'Suprimentos (BBs, Gás)',
  'Manutenção do Campo',
  'Transporte',
  'Administrativo',
  'Outros',
];

export const REVENUE_SOURCES = [
  'Jogos Abertos',
  'Jogos Fechados',
  'Aluguel de Equipamentos',
  'Venda de BBs',
  'Alimentos e Bebidas',
  'Mercadorias',
  'Outros',
];

// Currency formatting
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

// Date formatting
export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Generate ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Route config with permission requirements
export const ROUTES = {
  dashboard: { path: '/', label: 'Painel', permission: { action: 'read', resource: 'dashboard' } },
  games: { path: '/games', label: 'Jogos', permission: { action: 'read', resource: 'games' } },
  gameDetail: { path: '/games/:id', label: 'Detalhes do Jogo', permission: { action: 'read', resource: 'games' } },
  billing: { path: '/billing', label: 'Faturamento', permission: { action: 'read', resource: 'billing' } },
  finances: { path: '/finances', label: 'Finanças', permission: { action: 'read', resource: 'finances' } },
  analytics: { path: '/analytics', label: 'Análises', permission: { action: 'read', resource: 'analytics' } },
  equipment: { path: '/equipment', label: 'Equipamentos', permission: { action: 'read', resource: 'equipment' } },
  users: { path: '/users', label: 'Usuários', permission: { action: 'read', resource: 'users' } },
  settings: { path: '/settings', label: 'Configurações', permission: { action: 'read', resource: 'settings' } },
};
