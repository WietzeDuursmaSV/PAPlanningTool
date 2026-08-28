import { createContext } from 'react';
import type { Theme } from '@fluentui/react-components';

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
