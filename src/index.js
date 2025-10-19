import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { FinancialProvider } from './context/FinancialContext';

ReactDOM.render(
  <React.StrictMode>
    <FinancialProvider>
      <App />
    </FinancialProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
