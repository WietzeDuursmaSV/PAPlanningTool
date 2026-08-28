import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { webLightTheme, webDarkTheme } from '@fluentui/react-components';
import { ThemeContext } from './ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Get initial theme from localStorage or default to light mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('fluentSample-darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('fluentSample-darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev: boolean) => !prev);
  };

  const theme = isDarkMode ? webDarkTheme : webLightTheme;

  const value = {
    isDarkMode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
