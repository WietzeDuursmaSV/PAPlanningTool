import { Text, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { ReactNode } from 'react';

const useStyles = makeStyles({
  container: {
    marginBottom: '32px',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    marginBottom: '16px',
  },
  icon: {
    fontSize: '32px',
    color: tokens.colorBrandForeground1,
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
    maxWidth: '800px',
  },
});

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
}

export default function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <Text className={styles.subtitle}>
        {subtitle}
      </Text>
    </div>
  );
}
