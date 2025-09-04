import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

const FinancialContext = createContext();

const getDefaultEndDate = () => {
  const date = new Date(2030, 11, 31); // December 31, 2030
  return date.toISOString().split('T')[0];
};

const initialState = {
  income: [],
  expenses: [],
  savings: {
    currentAmount: 0,
    date: new Date().toISOString().split('T')[0],
    targetAmount: 0, // Target amount for balance adjustments
    adjustmentCycle: 1, // Adjustment cycle in years (default: 1 year)
  },
  projectedSavings: [],
};

// Debounce function for localStorage saves
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

function financialReducer(state, action) {
  switch (action.type) {
    case 'ADD_INCOME':
      return {
        ...state,
        income: [...state.income, action.payload],
      };
    case 'ADD_EXPENSE': {
      const expense = {
        ...action.payload,
        endDate: action.payload.endDate || getDefaultEndDate(),
      };
      return {
        ...state,
        expenses: [...state.expenses, expense],
      };
    }
    case 'UPDATE_EXPENSE': {
      const updatedExpenses = state.expenses.map(expense => 
        expense.id === action.payload.id ? action.payload : expense
      );
      return {
        ...state,
        expenses: updatedExpenses,
      };
    }
    case 'UPDATE_INCOME': {
      const updatedIncome = state.income.map(income => 
        income.id === action.payload.id ? action.payload : income
      );
      return {
        ...state,
        income: updatedIncome,
      };
    }
    case 'UPDATE_SAVINGS':
      return {
        ...state,
        savings: action.payload,
      };
    case 'UPDATE_SAVINGS_SETTINGS':
      return {
        ...state,
        savings: {
          ...state.savings,
          ...action.payload,
        },
      };
    case 'UPDATE_PROJECTED_SAVINGS':
      return {
        ...state,
        projectedSavings: action.payload,
      };
    case 'CLEAR_EXPENSES':
      return {
        ...state,
        expenses: [],
      };
    case 'LOAD_DATA':
      return {
        ...action.payload,
        income: action.payload.income || [],
        expenses: action.payload.expenses.map(expense => ({
          ...expense,
          endDate: expense.endDate || getDefaultEndDate(),
        })),
        projectedSavings: action.payload.projectedSavings || [],
        savings: {
          ...initialState.savings,
          ...action.payload.savings,
        },
      };
    default:
      return state;
  }
}

export function FinancialProvider({ children }) {
  const [state, dispatch] = useReducer(financialReducer, initialState);

  // Memoized save function with debouncing
  const saveToLocalStorage = useMemo(
    () => debounce((data) => {
      try {
        localStorage.setItem('financialData', JSON.stringify(data));
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
      }
    }, 500), // 500ms debounce
    []
  );

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('financialData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes (debounced)
  useEffect(() => {
    saveToLocalStorage(state);
  }, [state, saveToLocalStorage]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    dispatch
  }), [state]);

  return (
    <FinancialContext.Provider value={contextValue}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
} 