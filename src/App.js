import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import SavingsPlanner from './pages/SavingsPlanner';
import { FinancialProvider } from './context/FinancialContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FinancialProvider>
        <div className="App">
          <SavingsPlanner />
        </div>
      </FinancialProvider>
    </ThemeProvider>
  );
};

export default App; 