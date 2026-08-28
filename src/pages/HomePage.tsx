import { 
  Text, 
  Card, 
  makeStyles,
  shorthands,
  Link,
  tokens
} from '@fluentui/react-components';
import { 
  PeopleRegular,
  ArrowRightRegular
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  container: {
    maxWidth: '1200px',
    ...shorthands.margin('0', 'auto'),
  },
  powerAppsLove: {
    textAlign: 'center',
    ...shorthands.padding('64px', '24px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('2px', 'solid', tokens.colorNeutralStroke2),
    marginBottom: '48px',
  },
  loveText: {
    fontSize: '48px',
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    marginBottom: '16px',
    textShadow: `0 2px 4px ${tokens.colorNeutralShadowAmbient}`,
  },
  loveSubtext: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    ...shorthands.gap('24px'),
  },
  card: {
    height: '100%',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${tokens.colorNeutralShadowAmbient}`,
      ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
    },
  },
  cardIcon: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  cardDescription: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
    marginBottom: '16px',
  },
  cardButton: {
    marginTop: 'auto',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    ...shorthands.gap('20px'),
    marginTop: '24px',
  },
  featureCard: {
    ...shorthands.padding('24px'),
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: '32px',
    color: tokens.colorPaletteGreenForeground1,
    marginBottom: '12px',
  },
  featureTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  featureDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase200,
  },
});

const connectorExamples = [
  {
    path: '/office365',
    title: 'Office 365 Connector',
    description: 'Explore user profiles and organizational directory integration with live Office 365 data. Learn how to implement authentication and user search patterns.',
    icon: <PeopleRegular />,
    features: ['User Profiles', 'Directory Search', 'User Photos', 'Live Integration'],
  },
];

export default function HomePage() {
  const styles = useStyles();
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Power Apps Love Code Section - Now the Hero */}
      <section className={styles.powerAppsLove}>
        <div className={styles.loveText}>Power Apps ❤️ Code</div>
        <Text className={styles.loveSubtext}>
          Building amazing experiences with modern web technologies
        </Text>
      </section>

      {/* Examples Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Examples</h2>
        <Text size={300} style={{ color: tokens.colorNeutralForeground2, marginBottom: '24px', display: 'block' }}>
          Each example shows UI components, data handling and integration points where you can replace mock data with data from your Power Platform environment, using Power Apps SDK.
        </Text>
        
        <div className={styles.grid}>
          {connectorExamples.map((example) => (
            <Card 
              key={example.path} 
              className={styles.card}
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onClick={() => navigate(example.path)}
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = tokens.shadow16;
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = tokens.shadow4;
              }}
            >
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div className={styles.cardIcon}>{example.icon}</div>
              </div>
              
              <div style={{ padding: '0 24px 24px' }}>
                <Text 
                  as="h3" 
                  weight="semibold" 
                  size={400}
                  style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    color: tokens.colorNeutralForeground1 
                  }}
                >
                  {example.title}
                </Text>
                
                <Text 
                  size={300}
                  style={{ 
                    display: 'block',
                    marginBottom: '16px',
                    color: tokens.colorNeutralForeground2,
                    lineHeight: tokens.lineHeightBase300 
                  }}
                >
                  {example.description}
                </Text>
                
                <div style={{ marginBottom: '16px' }}>
                  {example.features.map((feature, index) => (
                    <Text
                      key={index}
                      size={200}
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        margin: '2px',
                        backgroundColor: tokens.colorNeutralBackground3,
                        borderRadius: tokens.borderRadiusSmall,
                        fontSize: '12px',
                        color: tokens.colorNeutralForeground2,
                      }}
                    >
                      {feature}
                    </Text>
                  ))}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  color: tokens.colorBrandForeground1,
                  fontWeight: tokens.fontWeightSemibold,
                  fontSize: tokens.fontSizeBase200,
                }}>
                  <span>Explore Example</span>
                  <ArrowRightRegular />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Getting Started Section */}
      <section className={styles.section}>
        <Card style={{ padding: '32px', backgroundColor: tokens.colorNeutralBackground2 }}>
          <h2 className={styles.sectionTitle}>Getting Started</h2>
          <Text size={300} style={{ marginBottom: '20px', display: 'block', color: tokens.colorNeutralForeground2 }}>
            This template is designed to help you learn Power Apps Code Apps patterns and provide
            a foundation for your own projects.
          </Text>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <Text weight="semibold" size={300} style={{ display: 'block', marginBottom: '8px', color: tokens.colorNeutralForeground1 }}>
                1. Explore Examples
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Navigate through each connector example to see different patterns and UI components in action.
              </Text>
            </div>
            
            <div>
              <Text weight="semibold" size={300} style={{ display: 'block', marginBottom: '8px', color: tokens.colorNeutralForeground1 }}>
                2. Understand the Code
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Review the source code, comments, and mock data structures to understand implementation patterns.
              </Text>
            </div>
            
            <div>
              <Text weight="semibold" size={300} style={{ display: 'block', marginBottom: '8px', color: tokens.colorNeutralForeground1 }}>
                3. Add Real Connectors
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Replace mock data with real Power Apps connectors using the clear integration points provided.
              </Text>
            </div>
          </div>
          
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link href="https://github.com/microsoft/PowerAppsCodeApps" target="_blank">
              Learn more about Power Apps Code Apps →
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
