import { createContext, useContext, useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

// Demo user accounts
const DEMO_USERS = [
  { id: 'user-owner', username: 'owner', password: 'owner123', name: 'Carlos Silva', email: 'carlos@tacopsfield.com', role: ROLES.OWNER, avatar: 'CS' },
  { id: 'user-admin', username: 'admin', password: 'admin123', name: 'Ana Santos', email: 'ana@tacopsfield.com', role: ROLES.ADMIN, avatar: 'AS' },
  { id: 'user-manager', username: 'manager', password: 'manager123', name: 'Rafael Costa', email: 'rafael@tacopsfield.com', role: ROLES.MANAGER, avatar: 'RC' },
  { id: 'user-staff', username: 'staff', password: 'staff123', name: 'Lucas Oliveira', email: 'lucas@tacopsfield.com', role: ROLES.STAFF, avatar: 'LO' },
  { id: 'user-referee', username: 'referee', password: 'referee123', name: 'Pedro Mendes', email: 'pedro@tacopsfield.com', role: ROLES.REFEREE, avatar: 'PM' },
];

export function AuthProvider({ children }) {
  const [savedUser, setSavedUser] = useLocalStorage('airsoft_user', null);
  const [user, setUser] = useState(savedUser);

  const login = useCallback((username, password) => {
    const found = DEMO_USERS.find(
      (u) => u.username === username && u.password === password
    );
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      setSavedUser(userData);
      return { success: true, user: userData };
    }
    return { success: false, error: 'Usuário ou senha inválidos' };
  }, [setSavedUser]);

  const loginAs = useCallback((role) => {
    const found = DEMO_USERS.find((u) => u.role === role);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      setSavedUser(userData);
      return { success: true, user: userData };
    }
    return { success: false, error: 'Perfil não encontrado' };
  }, [setSavedUser]);

  const logout = useCallback(() => {
    setUser(null);
    setSavedUser(null);
  }, [setSavedUser]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, loginAs, logout, isAuthenticated, DEMO_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
