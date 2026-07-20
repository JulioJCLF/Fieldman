import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  LayoutDashboard, Crosshair, Receipt, DollarSign, BarChart3,
  Package, Users, Settings, LogOut, ChevronLeft, ChevronRight,
  Search, Bell, Sun, Moon, Menu, X, Target
} from 'lucide-react';
import { ROLE_LABELS } from '../../utils/constants';

const NAV_ITEMS = [
  { section: 'Visão Geral' },
  { path: '/', icon: LayoutDashboard, label: 'Painel', permission: { action: 'read', resource: 'dashboard' } },

  { section: 'Operações' },
  { path: '/games', icon: Crosshair, label: 'Jogos', permission: { action: 'read', resource: 'games' } },
  { path: '/equipment', icon: Package, label: 'Equipamentos', permission: { action: 'read', resource: 'equipment' } },

  { section: 'Financeiro' },
  { path: '/billing', icon: Receipt, label: 'Faturamento', permission: { action: 'read', resource: 'billing' } },
  { path: '/finances', icon: DollarSign, label: 'Finanças', permission: { action: 'read', resource: 'finances' } },
  { path: '/analytics', icon: BarChart3, label: 'Análises', permission: { action: 'read', resource: 'analytics' } },

  { section: 'Administração' },
  { path: '/users', icon: Users, label: 'Usuários', permission: { action: 'read', resource: 'users' } },
  { path: '/settings', icon: Settings, label: 'Configurações', permission: { action: 'read', resource: 'settings' } },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { can } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get current page title
  const currentPage = NAV_ITEMS.find((item) => item.path && item.path === location.pathname);
  const pageTitle = currentPage?.label || 'Painel';

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Target size={20} />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              Tac<span>Ops</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, idx) => {
            if (item.section) {
              if (collapsed) return null;
              return (
                <div key={`section-${idx}`} className="nav-section-label">
                  {item.section}
                </div>
              );
            }

            // Check permission
            if (item.permission && !can(item.permission.action, item.permission.resource)) {
              return null;
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                end={item.path === '/'}
              >
                <Icon size={20} className="nav-item-icon" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Clique para sair">
            <div className="sidebar-user-avatar">
              {user?.avatar || 'U'}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name}</div>
                <div className="sidebar-user-role">{ROLE_LABELS[user?.role]}</div>
              </div>
            )}
          </div>
        </div>

        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main */}
      <main className="app-main">
        <header className="app-header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              id="mobile-menu-toggle"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="header-breadcrumbs">
              <span>TacOps</span>
              <span>/</span>
              <span className="current">{pageTitle}</span>
            </div>
          </div>
          <div className="header-right">
            <div className="header-search">
              <Search size={16} className="header-search-icon" />
              <input
                type="text"
                placeholder="Buscar..."
                id="global-search"
              />
            </div>
            <button
              className="header-icon-btn"
              onClick={toggleTheme}
              title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
              id="theme-toggle"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="header-icon-btn" id="notifications-btn" title="Notificações">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>
            <button
              className="header-icon-btn"
              onClick={handleLogout}
              title="Sair"
              id="logout-btn"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
