import { createContext, useContext, useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [savedTheme, setSavedTheme] = useLocalStorage('airsoft_theme', 'dark');
  const [theme, setThemeState] = useState(savedTheme);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    setSavedTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [setSavedTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Set initial theme attribute
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
