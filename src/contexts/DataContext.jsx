import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateId } from '../utils/constants';

const DataContext = createContext(null);

const DEFAULT_DATA = {
  games: [],
  equipment: [],
  billing: [],
  finances: [],
  expenses: [],
  players: [],
  fieldAreas: [],
  settings: {
    companyName: '',
    address: '',
    phone: '',
    email: '',
    defaultOpenPrice: 60,
    defaultClosedPrice: 2000,
    paymentMethods: ['Cash', 'PIX', 'Credit Card'],
    onboardingComplete: false,
  },
};

export function DataProvider({ children }) {
  const [data, setData] = useLocalStorage('airsoft_data', DEFAULT_DATA);

  // Generic CRUD helpers
  const addItem = useCallback((collection, item) => {
    const newItem = { ...item, id: item.id || generateId(), createdAt: new Date().toISOString() };
    setData((prev) => ({
      ...prev,
      [collection]: [...(prev[collection] || []), newItem],
    }));
    return newItem;
  }, [setData]);

  const updateItem = useCallback((collection, id, updates) => {
    setData((prev) => ({
      ...prev,
      [collection]: (prev[collection] || []).map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      ),
    }));
  }, [setData]);

  const deleteItem = useCallback((collection, id) => {
    setData((prev) => ({
      ...prev,
      [collection]: (prev[collection] || []).filter((item) => item.id !== id),
    }));
  }, [setData]);

  const getItem = useCallback((collection, id) => {
    return (data[collection] || []).find((item) => item.id === id);
  }, [data]);

  // Specific operations
  const addGame = useCallback((game) => addItem('games', game), [addItem]);
  const updateGame = useCallback((id, updates) => updateItem('games', id, updates), [updateItem]);
  const deleteGame = useCallback((id) => deleteItem('games', id), [deleteItem]);

  const addEquipment = useCallback((eq) => addItem('equipment', eq), [addItem]);
  const updateEquipment = useCallback((id, updates) => updateItem('equipment', id, updates), [updateItem]);
  const deleteEquipment = useCallback((id) => deleteItem('equipment', id), [deleteItem]);

  const addBilling = useCallback((bill) => addItem('billing', bill), [addItem]);
  const updateBilling = useCallback((id, updates) => updateItem('billing', id, updates), [updateItem]);
  const deleteBilling = useCallback((id) => deleteItem('billing', id), [deleteItem]);

  const addFinance = useCallback((fin) => addItem('finances', fin), [addItem]);
  const updateFinance = useCallback((id, updates) => updateItem('finances', id, updates), [updateItem]);
  const deleteFinance = useCallback((id) => deleteItem('finances', id), [deleteItem]);

  const addExpense = useCallback((exp) => addItem('expenses', exp), [addItem]);
  const updateExpense = useCallback((id, updates) => updateItem('expenses', id, updates), [updateItem]);
  const deleteExpense = useCallback((id) => deleteItem('expenses', id), [deleteItem]);

  const addPlayer = useCallback((player) => addItem('players', player), [addItem]);
  const updatePlayer = useCallback((id, updates) => updateItem('players', id, updates), [updateItem]);

  const addUser = useCallback((user) => addItem('users', user), [addItem]);
  const updateUser = useCallback((id, updates) => updateItem('users', id, updates), [updateItem]);
  const deleteUser = useCallback((id) => deleteItem('users', id), [deleteItem]);

  const updateSettings = useCallback((updates) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, [setData]);

  const addFieldArea = useCallback((area) => addItem('fieldAreas', area), [addItem]);
  const updateFieldArea = useCallback((id, updates) => updateItem('fieldAreas', id, updates), [updateItem]);
  const deleteFieldArea = useCallback((id) => deleteItem('fieldAreas', id), [deleteItem]);

  // Bulk set (for seed data)
  const setAllData = useCallback((newData) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, [setData]);

  const resetData = useCallback(() => {
    setData(DEFAULT_DATA);
  }, [setData]);

  const value = {
    // Data
    games: data.games || [],
    equipment: data.equipment || [],
    billing: data.billing || [],
    finances: data.finances || [],
    expenses: data.expenses || [],
    players: data.players || [],
    fieldAreas: data.fieldAreas || [],
    settings: data.settings || DEFAULT_DATA.settings,

    // Games
    addGame, updateGame, deleteGame,

    // Equipment
    addEquipment, updateEquipment, deleteEquipment,

    // Billing
    addBilling, updateBilling, deleteBilling,

    // Finances
    addFinance, updateFinance, deleteFinance,

    // Expenses
    addExpense, updateExpense, deleteExpense,

    // Players
    addPlayer, updatePlayer,

    // Users (stored separately but managed here for convenience)
    addUser, updateUser, deleteUser,

    // Field Areas
    addFieldArea, updateFieldArea, deleteFieldArea,

    // Settings
    updateSettings,

    // Bulk operations
    setAllData, resetData, getItem,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
