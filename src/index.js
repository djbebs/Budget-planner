import React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { FinancialProvider } from './context/FinancialContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

// Root component with providers and error boundary
const Root = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FinancialProvider>
          <App />
        </FinancialProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

// Create root and render
const container = document.getElementById('root');
const root = createRoot(container);

// Render with error handling
try {
  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render application:', error);
  root.render(
    <div style={{ padding: '20px', color: 'red' }}>
      <h1>Application Failed to Load</h1>
      <p>Please try refreshing the page. If the problem persists, contact support.</p>
    </div>
  );
} 