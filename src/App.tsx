import { Routes, Route } from 'react-router-dom'
import { makeStyles, shorthands, tokens, Spinner } from '@fluentui/react-components'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'

// Lazy load pages for code splitting
const PlanningToolPage = lazy(() => import('./pages/PlanningToolPage'))

const useStyles = makeStyles({
  root: {
    ...shorthands.margin(0),
    ...shorthands.padding(0),
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
  },
});

function App() {
  const styles = useStyles();

  const LoadingFallback = () => (
    <div className={styles.loadingContainer}>
      <Spinner size="medium" label="Loading page..." />
    </div>
  );

  return (
    <div className={styles.root}>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<PlanningToolPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </div>
  )
}

export default App
