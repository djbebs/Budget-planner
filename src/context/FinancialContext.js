import React, { createContext, useContext, useReducer, useEffect } from 'react';

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
  },
  projectedSavings: [],
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
    case 'UPDATE_PROJECTED_SAVINGS':
      return {
        ...state,
        projectedSavings: action.payload,
      };
    case 'LOAD_DATA':
      return {
        ...action.payload,
        expenses: action.payload.expenses.map(expense => ({
          ...expense,
          endDate: expense.endDate || getDefaultEndDate(),
        })),
        projectedSavings: action.payload.projectedSavings || [],
      };
    default:
      return state;
  }
}

export function FinancialProvider({ children }) {
  const [state, dispatch] = useReducer(financialReducer, initialState);

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

  // Save data to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('financialData', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [state]);

  return (
    <FinancialContext.Provider value={{ state, dispatch }}>
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