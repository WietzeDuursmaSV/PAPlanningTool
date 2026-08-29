import type { ReactNode } from 'react';
import { 
  makeStyles, 
  shorthands,
  Text,
  Button,
  tokens,
} from '@fluentui/react-components';
import { 
  WeatherMoonRegular,
  WeatherSunnyRegular
} from '@fluentui/react-icons';
import { useTheme } from '../hooks/useTheme';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100vw',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginTop: '60px',
    width: '100vw',
  },
  appHeader: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('16px', '24px'),
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '60px',
    boxShadow: tokens.shadow4,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  main: {
    flex: 1,
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    overflow: 'auto',
    minHeight: 'calc(100vh - 120px)',
    '@media (max-width: 768px)': {
      ...shorthands.padding('16px'),
      minHeight: 'calc(100vh - 180px)',
    },
  },
  footer: {
    ...shorthands.padding('16px', '24px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    '@media (max-width: 768px)': {
      ...shorthands.padding('12px', '16px'),
      fontSize: tokens.fontSizeBase100,
    },
  },
});

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const styles = useStyles();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className={styles.root}>
      <header className={styles.appHeader}>
        <div className={styles.headerLeft}>
          <img 
            src="./PowerApps_scalable.svg" 
            alt="Power Apps" 
            style={{ width: '24px', height: '24px' }} 
          />
          <Text weight="semibold" size={500} style={{ color: tokens.colorNeutralForeground1 }}>
            Planning Tool 
          </Text>
        </div>

        <Button
          icon={isDarkMode ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
          appearance="subtle"
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        />
      </header>

      <div className={styles.content}>
        <main className={styles.main}>
          {children}
        </main>

 
      </div>
    </div>
  );
}
