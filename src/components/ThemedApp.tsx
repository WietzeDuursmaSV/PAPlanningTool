import { FluentProvider } from '@fluentui/react-components';
import { QueryClientProvider } from '@tanstack/react-query';
import { HashRouter } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { queryClient } from '../main';
import App from '../App';

export const ThemedApp = () => {
  const { theme } = useTheme();

  // Fluent UI components read fontFamilyBase from the theme, not from CSS,
  // so overriding it here ensures Open Sans isn't overridden by Fluent's defaults.
  const themedFont = {
    ...theme,
    fontFamilyBase: "'Open Sans', sans-serif",
  };

  return (
    <FluentProvider theme={themedFont}>
      <QueryClientProvider client={queryClient}> 
        <HashRouter>
          <App />
        </HashRouter>
      </QueryClientProvider>
    </FluentProvider>
  );
};
