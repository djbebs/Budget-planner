import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  TableSortLabel,
  Box,
  Fab,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  ExpandMore,
  ExpandLess,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Timeline as TimelineIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useFinancial } from '../context/FinancialContext';
import SavingsChart from '../components/SavingsChart';
// SeparatedSavingsChart is not currently used
// import SeparatedSavingsChart from '../components/SeparatedSavingsChart';
import FinancialDashboard from '../components/FinancialDashboard';
import { saveAs } from 'file-saver';
import { calculateMonthlySavingsNeeded, getMonthlyCalculationDetails } from '../utils';
import MonthlyBillsPieChart from '../components/MonthlyBillsPieChart';

const SavingsPlanner = ({ themeMode, toggleTheme }) => {
  const { state, dispatch } = useFinancial();
  const [totalSavingsNeeded, setTotalSavingsNeeded] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [errors, setErrors] = useState({});
  const [newExpense, setNewExpense] = useState({
    category: '',
    subcategory: '',
    description: '',
    amount: '',
    recurrence: '',
    paymentSchedule: '',
    endDate: '2030-12-31',
    oneOffDate: '',
  });
  const [monthlyCalculation, setMonthlyCalculation] = useState([]);
  const [showMonthlyDetails, setShowMonthlyDetails] = useState(false);
  const [newIncome, setNewIncome] = useState({
    person: '',
    source: '',
    frequency: '',
    amount: '',
    startDate: '',
    endDate: '',
  });
  const [openIncomeDialog, setOpenIncomeDialog] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [incomeErrors, setIncomeErrors] = useState({});
  const [showMonthlyBills, setShowMonthlyBills] = useState(false);
  const [monthlyBillsSort, setMonthlyBillsSort] = useState({
    field: 'category',
    direction: 'asc'
  });
  const [showWebAppDescription, setShowWebAppDescription] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [regularSavingsNeeded, setRegularSavingsNeeded] = useState(0);
  const [oneOffSavingsNeeded, setOneOffSavingsNeeded] = useState(0);
  const [oneOffTimeline, setOneOffTimeline] = useState([]);
  const [expenseFilter, setExpenseFilter] = useState('all'); // 'all', 'regular', 'oneoff'
  const [mainTab, setMainTab] = useState(0); // 0: Input, 1: Output

  const categories = [
    'Tax',
    'Mortgage',
    'Insurance',
    'Cars',
    'Education',
    'Utility bills'
  ];

  const recurrenceTypes = [
    'Monthly',
    'Annual',
    'One-off',
    'Irregular'
  ];

  const frequencyTypes = [
    'Monthly',
    '1 off'
  ];

  const fileInputRef = useRef(null);
  const incomeFileInputRef = useRef(null);

  // Add state for new category input
  const [newCategory, setNewCategory] = useState("");
  const [customCategories, setCustomCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Function to add a new category
  const handleAddCategory = () => {
    if (newCategory.trim() !== "" && !categories.includes(newCategory) && !customCategories.includes(newCategory)) {
      setCustomCategories([...customCategories, newCategory]);
      setNewCategory("");
      setShowAddCategory(false);
    }
  };

  const calculateMonthlyEquivalent = (expense) => {
    const amount = parseFloat(expense.amount);
    if (isNaN(amount)) return 0;

    switch (expense.recurrence) {
      case 'Annual':
      case 'Irregular':
        return amount / 12;
      default:
        return 0;
    }
  };

  // Calculate regular monthly savings (excluding one-off payments)
  const calculateRegularSavings = (expenses) => {
    const regularExpenses = expenses.filter(exp => 
      exp.recurrence === 'Monthly' || exp.recurrence === 'Annual' || exp.recurrence === 'Irregular'
    );
    
    let totalMonthly = 0;
    regularExpenses.forEach(expense => {
      if (expense.recurrence === 'Monthly') {
        totalMonthly += parseFloat(expense.amount) || 0;
      } else {
        totalMonthly += calculateMonthlyEquivalent(expense);
      }
    });
    
    return totalMonthly;
  };

  // Calculate one-off payment timeline and required monthly savings
  const calculateOneOffTimeline = (expenses) => {
    // Validate expenses array
    if (!expenses || !Array.isArray(expenses)) {
      console.error('Invalid expenses array provided to calculateOneOffTimeline');
      return { timeline: [], totalOneOffSavings: 0 };
    }
    
    const oneOffExpenses = expenses.filter(exp => exp && typeof exp === 'object' && exp.recurrence === 'One-off');
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const timeline = oneOffExpenses.map(expense => {
      // Validate expense object
      if (!expense || typeof expense !== 'object') {
        console.error('Invalid expense object in calculateOneOffTimeline:', expense);
        return null;
      }
      
      let paymentDate;
      
      if (expense.oneOffDate) {
        paymentDate = new Date(expense.oneOffDate);
      } else if (expense.paymentSchedule) {
        const [day, month] = expense.paymentSchedule.split('.');
        const currentYear = startDate.getFullYear();
        paymentDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
        
        if (paymentDate <= startDate) {
          paymentDate.setFullYear(currentYear + 1);
        }
      } else {
        paymentDate = new Date(startDate);
        paymentDate.setFullYear(startDate.getFullYear() + 1);
      }
      
      // Validate payment date
      if (!paymentDate || isNaN(paymentDate.getTime())) {
        console.error('Invalid payment date calculated for expense:', expense);
        paymentDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());
      }
      
      const monthsUntil = Math.max(1, Math.ceil(
        (paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
        (paymentDate.getMonth() - startDate.getMonth())
      ));
      
      const expenseAmount = parseFloat(expense.amount) || 0;
      const monthlyContribution = expenseAmount / monthsUntil;
      
      return {
        ...expense,
        paymentDate,
        monthsUntil,
        expenseAmount,
        monthlyContribution,
        monthName: paymentDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      };
    }).filter(item => item !== null).sort((a, b) => a.paymentDate - b.paymentDate);
    
    const totalOneOffSavings = timeline.reduce((sum, item) => sum + item.monthlyContribution, 0);
    
    return { timeline, totalOneOffSavings };
  };

  const getNextDueDate = (expense) => {
    // Validate expense object
    if (!expense || typeof expense !== 'object') {
      console.error('Invalid expense object provided to getNextDueDate:', expense);
      return '';
    }
    
    const today = new Date();
    if (!expense.paymentSchedule && expense.recurrence !== 'Monthly') return '';

    if (expense.recurrence === 'Monthly') {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return nextMonth.toISOString().split('T')[0];
    }

    if (expense.recurrence === 'Irregular' || expense.recurrence === 'One-off' || expense.recurrence === 'Annual') {
      const dates = expense.paymentSchedule.split(';')
        .map(dateStr => {
          const [day, month] = dateStr.trim().split('.');
          let year = today.getFullYear();
          
          // Create date string in YYYY-MM-DD format to avoid timezone issues
          const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          let date = new Date(dateString + 'T00:00:00.000Z'); // Force UTC
          
          // If the date has passed, move to next year
          if (date < today) {
            const nextYearDateString = `${year + 1}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            date = new Date(nextYearDateString + 'T00:00:00.000Z'); // Force UTC
          }
          return date;
        })
        .filter(date => date >= today)
        .sort((a, b) => a - b);

      return dates.length > 0 ? dates[0].toISOString().split('T')[0] : '';
    }

    return '';
  };

  const generateNotes = (expense) => {
    // Validate expense object
    if (!expense || typeof expense !== 'object') {
      console.error('Invalid expense object provided to generateNotes:', expense);
      return '';
    }
    
    if (!expense.amount) return '';
    const amount = parseFloat(expense.amount);
    
    switch (expense.recurrence) {
      case 'Monthly':
        return '12 payments of ' + amount.toFixed(2) + ' CHF per year';
      case 'Annual':
        return '1 payment of ' + amount.toFixed(2) + ' CHF per year';
      case 'One-off':
        return '1 payment of ' + amount.toFixed(2) + ' CHF';
      case 'Irregular':
        const dates = expense.paymentSchedule.split(';').filter(d => d);
        return dates.length + ' payments of ' + (amount / dates.length).toFixed(2) + ' CHF per year';
      default:
        return '';
    }
  };

  const validateExpense = (expense) => {
    const newErrors = {};
    if (!expense.category) newErrors.category = 'Category is required';
    if (!expense.amount) newErrors.amount = 'Amount is required';
    if (!expense.recurrence) newErrors.recurrence = 'Recurrence is required';
    if (expense.recurrence === 'Irregular' && !expense.paymentSchedule) {
      newErrors.paymentSchedule = 'Payment schedule is required for Irregular payments';
    }
    if (expense.recurrence === 'One-off' && !expense.oneOffDate) {
      newErrors.oneOffDate = 'Payment date is required for One-off payments';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    // Calculate regular savings (excluding one-off payments)
    const regularSavings = calculateRegularSavings(state.expenses);
    setRegularSavingsNeeded(regularSavings);
    
    // Calculate one-off timeline and savings
    const { timeline, totalOneOffSavings } = calculateOneOffTimeline(state.expenses);
    setOneOffTimeline(timeline);
    setOneOffSavingsNeeded(totalOneOffSavings);
    
    // Calculate total savings needed
    const totalSavings = regularSavings + totalOneOffSavings;
    setTotalSavingsNeeded(totalSavings);
    
    // Keep the original calculation for the detailed monthly breakdown
    const monthlyCalc = getMonthlyCalculationDetails(
      state.expenses, 
      state.savings.currentAmount,
      state.savings.targetAmount,
      state.savings.adjustmentCycle
    );
    setMonthlyCalculation(monthlyCalc);

    // Calculate projected savings inside useEffect to avoid dependency issues
    const calculateProjectedSavings = () => {
      const projectedPoints = [];
      const startingBalance = parseFloat(state.savings.currentAmount) || 0;
      console.log("Starting balance in calculateProjectedSavings:", startingBalance);
      
      // Debug - Check for adjustment months
      const adjustmentMonths = monthlyCalc.filter(m => m.isAdjustingToInitial);
      console.log("Found adjustment months:", adjustmentMonths.length, adjustmentMonths);
      
      // Process each month from the calculation
      monthlyCalc.forEach((month, index) => {
        // Add points for this month
        const monthDate = month.date; // Format: "Jan 2023"
        
        // Parse the month string to get a date object 
        const dateParts = monthDate.split(' ');
        const monthName = dateParts[0];
        const year = parseInt(dateParts[1]);
        
        // Convert month name to month index (0-11)
        const monthMap = {"Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, 
                          "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11};
        const monthIndex = monthMap[monthName];
        
        // Create a Date object (1st day of month)
        const date = new Date(year, monthIndex, 1);
        
        // Convert to monthKey format used by chart (YYYY-MM)
        const monthKey = date.toISOString().slice(0, 7);
        
        if (month.isAdjustingToInitial) {
          // Handle the special adjustment month where we return to 10% of starting balance
          console.log("Adjustment month found:", month);
          
          // First point shows the balance before adjustment
          projectedPoints.push({
            date: monthKey,
            amount: month.startBalance,
            type: 'savings',
            monthlySaving: 0,
            isAdjustingToInitial: false
          });
          
          // Second point shows the balance after adjustment
          // This point needs to be clearly marked for the purple color
          projectedPoints.push({
            date: monthKey,
            amount: month.endBalance,
            type: 'adjustment',
            adjustmentAmount: month.monthlySaving,
            isAdjustingToInitial: true, // Explicitly mark this point for the purple color
            adjusts: true // Alternative flag in case the chart is looking for a different property
          });
          
          console.log("Added adjustment point:", { 
            month: monthKey, 
            startBalance: month.startBalance,
            endBalance: month.endBalance,
            adjustment: month.monthlySaving 
          });
        } else if (month.stabilizedAtInitial) {
          // For months after the adjustment, just show the stable balance (10% of starting balance)
          projectedPoints.push({
            date: monthKey,
            amount: month.startBalance,
            type: 'savings',
            monthlySaving: 0,
            stabilizedAtInitial: true
          });
        } else {
          // Regular month handling
          // First point (after adding monthly savings)
          const savingsBalance = month.startBalance + month.monthlySaving;
          projectedPoints.push({
            date: monthKey,
            amount: savingsBalance,
            type: 'savings',
            monthlySaving: month.monthlySaving
          });
          
          // Second point (after paying expenses) - only add if there are expenses
          if (month.totalExpenses > 0) {
            projectedPoints.push({
              date: monthKey,
              amount: month.endBalance,
              type: 'expense',
              expenseName: month.expenses.join(', '),
              hasSignificantExpense: month.hasSignificantExpense
            });
          }
        }
      });
      
      console.log("Generated projected points:", projectedPoints);
      console.log("Purple points should be:", projectedPoints.filter(p => p.isAdjustingToInitial));
      return projectedPoints;
    };

    const projectedPoints = calculateProjectedSavings();
    dispatch({
      type: 'UPDATE_PROJECTED_SAVINGS',
      payload: projectedPoints
    });
  }, [state.expenses, state.savings.currentAmount, state.savings.targetAmount, state.savings.adjustmentCycle, dispatch, calculateRegularSavings]);

  const handleSavingsUpdate = (amount) => {
    console.log("Updating savings amount to:", amount);
    const numericAmount = parseFloat(amount) || 0;
    
    dispatch({
      type: 'UPDATE_SAVINGS',
      payload: {
        ...state.savings,
        currentAmount: numericAmount,
        date: new Date().toISOString().split('T')[0],
      },
    });
    
    // Force recalculation of monthly savings needed
    const monthlySavings = calculateMonthlySavingsNeeded(
      state.expenses, 
      numericAmount,
      state.savings.targetAmount,
      state.savings.adjustmentCycle
    );
    setTotalSavingsNeeded(monthlySavings);

    const monthlyCalc = getMonthlyCalculationDetails(
      state.expenses,
      numericAmount,
      state.savings.targetAmount,
      state.savings.adjustmentCycle
    );
    setMonthlyCalculation(monthlyCalc);
  };

  const handleTargetAmountUpdate = (value) => {
    dispatch({
      type: 'UPDATE_SAVINGS_SETTINGS',
      payload: { targetAmount: parseFloat(value) || 0 }
    });
  };

  const handleAddExpense = () => {
    if (!validateExpense(newExpense)) return;

    let expense = { ...newExpense };
    if (expense.recurrence === 'One-off') {
      // Store paymentSchedule as DD.MM for calculation compatibility
      const dateObj = new Date(expense.oneOffDate);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      expense.paymentSchedule = `${day}.${month}`;
      expense.endDate = '';
      // Keep the original oneOffDate for editing purposes
      // expense.oneOffDate is already set from the form
    }
    expense = {
      ...expense,
      id: Date.now().toString(),
      amount: parseFloat(expense.amount),
      monthlyEquivalent: calculateMonthlyEquivalent(expense),
      nextDueDate: getNextDueDate(expense),
      notes: generateNotes(expense),
    };

    dispatch({ type: 'ADD_EXPENSE', payload: expense });
    setNewExpense({
      category: '',
      subcategory: '',
      description: '',
      amount: '',
      recurrence: '',
      paymentSchedule: '',
      endDate: '2030-12-31',
      oneOffDate: '',
    });
    setOpenDialog(false);
  };

  const handleEditExpense = (expense) => {
    if (!validateExpense(expense)) return;

    let updatedExpense = { ...expense };
    if (updatedExpense.recurrence === 'One-off') {
      const dateObj = new Date(updatedExpense.oneOffDate);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      updatedExpense.paymentSchedule = `${day}.${month}`;
      updatedExpense.endDate = '';
      // Keep the original oneOffDate for editing purposes
      // updatedExpense.oneOffDate is already set from the form
    }
    updatedExpense = {
      ...updatedExpense,
      amount: parseFloat(updatedExpense.amount),
      monthlyEquivalent: calculateMonthlyEquivalent(updatedExpense),
      nextDueDate: getNextDueDate(updatedExpense),
      notes: generateNotes(updatedExpense),
    };

    dispatch({ type: 'UPDATE_EXPENSE', payload: updatedExpense });
    setEditingExpense(null);
    setOpenDialog(false);
  };

  const handleDeleteExpense = (id) => {
    const updatedExpenses = state.expenses.filter(expense => expense.id !== id);
    dispatch({ 
      type: 'LOAD_DATA', 
      payload: { 
        ...state, 
        expenses: updatedExpenses 
      } 
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n');
        // Detect delimiter: use semicolon, tab, or comma
        let delimiter = ',';
        if (rows[0].includes(';')) delimiter = ';';
        else if (rows[0].includes('\t')) delimiter = '\t';
        // Helper to strip quotes and trim
        const clean = v => v.replace(/^"|"$/g, '').trim();
        // Helper to parse amount, removing currency symbols and thousands separators
        const parseAmount = v => parseFloat(clean(v).replace(/[^0-9.,-]+/g, '').replace(/[']/g, '').replace(/,/g, '.')) || 0;
        const headers = rows[0].split(delimiter).map(clean);
        
        const newExpenses = rows.slice(1)
          .filter(row => row.trim()) // Skip empty rows
          .map(row => {
            const values = row.split(delimiter).map(clean);
            // Helper to format date to YYYY-MM-DD if in DD/MM/YYYY
            const formatDate = (dateStr) => {
              if (!dateStr) return '';
              if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
                const [day, month, year] = dateStr.split('/');
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              return dateStr;
            };
            
            // Get basic expense data
            const expense = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              category: values[headers.indexOf('Category')] || '',
              subcategory: values[headers.indexOf('Subcategory')] || '',
              description: values[headers.indexOf('Description')] || '',
              amount: parseAmount(values[headers.indexOf('Amount')]),
              recurrence: values[headers.indexOf('Recurrence')] || '',
              paymentSchedule: values[headers.indexOf('Payment Schedule')] || '',
              startDate: values[headers.indexOf('Start date')] || '',
              endDate: values[headers.indexOf('End Date')] || '2030-12-31',
              oneOffDate: (values[headers.indexOf('Recurrence')] === 'One-off') ? formatDate(values[headers.indexOf('End Date')] || '') : '',
            };
            
            // For one-off expenses, ensure paymentSchedule is set correctly
            if (expense.recurrence === 'One-off') {
              // If there's already a valid payment schedule (e.g., "1.08"), keep it and set oneOffDate from it
              if (expense.paymentSchedule && /^\d{1,2}\.\d{1,2}$/.test(expense.paymentSchedule)) {
                // Valid payment schedule already exists, use it for oneOffDate
                const [day, month] = expense.paymentSchedule.split('.');
                const year = new Date().getFullYear();
                const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                expense.oneOffDate = dateStr;
              } else {
                // No valid payment schedule, extract from End Date
                const endDate = values[headers.indexOf('End Date')];
                if (endDate && endDate.includes('/')) {
                  // Format: DD/MM/YYYY
                  const [day, month] = endDate.split('/');
                  expense.paymentSchedule = `${day}.${month}`;
                } else if (endDate && endDate.includes('-')) {
                  // Format: YYYY-MM-DD
                  const parts = endDate.split('-');
                  expense.paymentSchedule = `${parts[2]}.${parts[1]}`;
                } else if (endDate) {
                  // Try to extract date in any other format
                  const dateObj = new Date(endDate);
                  if (!isNaN(dateObj.getTime())) {
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    expense.paymentSchedule = `${day}.${month}`;
                  }
                }
              }
            }
            
            return {
              ...expense,
              monthlyEquivalent: calculateMonthlyEquivalent(expense),
              nextDueDate: getNextDueDate(expense),
              notes: generateNotes(expense)
            };
          });

        // Add all new expenses to the state
        newExpenses.forEach(expense => {
          dispatch({ type: 'ADD_EXPENSE', payload: expense });
        });
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
  };

  // Export expenses to CSV
  const handleExportCSV = () => {
    const headers = [
      'Category', 'Subcategory', 'Description', 'Amount', 'Recurrence', 'Payment Schedule', 'Next Due Date', 'End Date'
    ];
    const rows = state.expenses.map(exp => [
      exp.category,
      exp.subcategory,
      exp.description,
      exp.amount,
      exp.recurrence,
      exp.paymentSchedule,
      getNextDueDate(exp),
      exp.endDate
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val ?? ''}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'expenses_export.csv');
  };

  const validateIncome = (income) => {
    const newErrors = {};
    if (!income.person) newErrors.person = 'Person is required';
    if (!income.source) newErrors.source = 'Source is required';
    if (!income.amount) newErrors.amount = 'Amount is required';
    if (!income.frequency) newErrors.frequency = 'Frequency is required';
    if (income.frequency === '1 off' && !income.startDate) newErrors.startDate = 'Date is required for one-off income';
    setIncomeErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddIncome = () => {
    if (!validateIncome(newIncome)) return;

    const income = {
      ...newIncome,
      id: Date.now().toString(),
      amount: parseFloat(newIncome.amount),
    };

    dispatch({ type: 'ADD_INCOME', payload: income });
    setNewIncome({
      person: '',
      source: '',
      frequency: '',
      amount: '',
      startDate: '',
      endDate: '',
    });
    setOpenIncomeDialog(false);
  };

  const handleEditIncome = (income) => {
    if (!validateIncome(income)) return;

    const updatedIncome = {
      ...income,
      amount: parseFloat(income.amount),
    };

    dispatch({ type: 'UPDATE_INCOME', payload: updatedIncome });
    setEditingIncome(null);
    setOpenIncomeDialog(false);
  };

  const handleDeleteIncome = (id) => {
    const updatedIncomes = state.income.filter(income => income.id !== id);
    dispatch({ 
      type: 'LOAD_DATA', 
      payload: { 
        ...state, 
        income: updatedIncomes 
      } 
    });
  };

  const handleIncomeFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(header => header.trim());
        const newIncomes = rows.slice(1)
          .filter(row => row.trim())
          .map(row => {
            const values = row.split(',').map(value => value.trim());
            const frequency = values[headers.indexOf('Frequency')] || '';
            return {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              person: values[headers.indexOf('Person')] || '',
              source: values[headers.indexOf('Source')] || '',
              frequency,
              amount: parseFloat(values[headers.indexOf('Amount(CHF)')]) || 0,
              startDate: frequency === '1 off' ? (values[headers.indexOf('Income Schedule')] || '') : '',
            };
          });
        newIncomes.forEach(income => {
          dispatch({ type: 'ADD_INCOME', payload: income });
        });
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const handleExportIncomeCSV = () => {
    const headers = [
      'Person', 'Source', 'Frequency', 'Amount(CHF)', 'Income Schedule'
    ];
    const rows = state.income.map(inc => [
      inc.person,
      inc.source,
      inc.frequency,
      inc.amount,
      inc.frequency === 'Monthly' ? 'Monthly' : inc.startDate
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val ?? ''}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'income_export.csv');
  };

  // Function to handle sorting in Monthly Bill Details table
  const handleSortRequest = (field) => {
    const isAsc = monthlyBillsSort.field === field && monthlyBillsSort.direction === 'asc';
    setMonthlyBillsSort({
      field,
      direction: isAsc ? 'desc' : 'asc'
    });
  };

  // Function to filter expenses based on type
  const getFilteredExpenses = (expenses, filter) => {
    switch (filter) {
      case 'regular':
        return expenses.filter(exp => 
          exp.recurrence === 'Monthly' || exp.recurrence === 'Annual' || exp.recurrence === 'Irregular'
        );
      case 'oneoff':
        return expenses.filter(exp => exp.recurrence === 'One-off');
      default:
        return expenses;
    }
  };

  // Function to sort expenses
  const getSortedExpenses = (expenses, sortConfig) => {
    return [...expenses].sort((a, b) => {
      let aValue, bValue;
      
      if (sortConfig.field === 'amount') {
        // For amount, use the monthly equivalent for non-monthly expenses
        if (a.recurrence === 'Monthly') {
          aValue = parseFloat(a.amount) || 0;
        } else {
          aValue = calculateMonthlyEquivalent(a);
        }
        
        if (b.recurrence === 'Monthly') {
          bValue = parseFloat(b.amount) || 0;
        } else {
          bValue = calculateMonthlyEquivalent(b);
        }
      } else {
        // For other fields, compare directly
        aValue = a[sortConfig.field] || '';
        bValue = b[sortConfig.field] || '';
        
        // Case insensitive string comparison for non-numeric fields
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
        }
        if (typeof bValue === 'string') {
          bValue = bValue.toLowerCase();
        }
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 }, typography: { fontSize: { xs: 16, md: 18 } } }}>
      {/* Theme Toggle Button */}
      <Tooltip title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}>
        <Fab
          color="primary"
          aria-label="toggle-theme"
          onClick={toggleTheme}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          {themeMode === 'light' ? <DarkModeIcon fontSize="large" /> : <LightModeIcon fontSize="large" />}
        </Fab>
      </Tooltip>
      
      {/* Main Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={mainTab} 
          onChange={(e, newValue) => setMainTab(newValue)}
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              py: 3,
              minHeight: 80
            }
          }}
        >
          <Tab 
            icon={<ReceiptIcon sx={{ fontSize: '2rem' }} />} 
            label="Input Data" 
            iconPosition="start"
            sx={{ fontSize: '1.5rem' }}
          />
          <Tab 
            icon={<AssessmentIcon sx={{ fontSize: '2rem' }} />} 
            label="View Results" 
            iconPosition="start"
            sx={{ fontSize: '1.5rem' }}
          />
        </Tabs>
      </Paper>

      {/* Summary Section - Only show on Output tab */}
      {mainTab === 1 && (
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', fontSize: { xs: '2rem', sm: '3rem', md: '4rem' } }}>
          Financial Planning Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, mb: 1 }}>
              Regular Monthly Savings
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 'bold' }}>
              {regularSavingsNeeded.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              For recurring expenses (monthly, annual, irregular)
              </Typography>
            </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, mb: 1 }}>
              One-off Payment Savings
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 'bold' }}>
              {oneOffSavingsNeeded.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              For {oneOffTimeline.length} upcoming one-off payment(s)
              </Typography>
            </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, mb: 1 }}>
              Total Monthly Savings
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 'bold' }}>
              {totalSavingsNeeded.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Combined savings requirement
              </Typography>
            </Grid>
          </Grid>
      </Paper>
      )}

      {/* Input Tab Content */}
      {mainTab === 0 && (
      <Grid container spacing={3}>
          {/* Instructions Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1.8rem' }}>
                📝 Input Your Financial Data
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.2rem', mb: 2 }}>
                Use this tab to enter and manage your financial information. Start by setting your current savings and target balance, 
                then add your income sources and expenses. The system will automatically calculate your required monthly savings.
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '1.1rem', fontStyle: 'italic' }}>
                💡 Tip: Switch to the "View Results" tab to see charts, detailed calculations, and financial projections.
              </Typography>
            </Paper>
          </Grid>

          {/* Quick Summary Cards */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="h6" sx={{ fontSize: '1.2rem', mb: 1 }}>
                    Total Monthly Savings
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {totalSavingsNeeded.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                  <Typography variant="h6" sx={{ fontSize: '1.2rem', mb: 1 }}>
                    Current Balance
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {state.savings.currentAmount.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                  <Typography variant="h6" sx={{ fontSize: '1.2rem', mb: 1 }}>
                    Target Balance
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {state.savings.targetAmount.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                  <Typography variant="h6" sx={{ fontSize: '1.2rem', mb: 1 }}>
                    Total Expenses
                  </Typography>
                  <Typography variant="h4" sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {state.expenses.length}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

        {/* Current Savings Section */}
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3, fontSize: '2rem' }}>
                Financial Settings
              </Typography>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
            <Tooltip title="This is your current savings amount.">
              <TextField
                      fullWidth
                      label="Current Savings (CHF)"
                type="number"
                value={state.savings.currentAmount}
                onChange={(e) => handleSavingsUpdate(e.target.value)}
                sx={{ 
                        '& .MuiInputLabel-root': { fontSize: '1.2rem' },
                        '& .MuiInputBase-input': { fontSize: '1.3rem', py: 2 }
                }}
              />
            </Tooltip>
                </Grid>
                <Grid item xs={12} md={6}>
            <Tooltip title="This is the minimum balance you should never go below. It acts as your financial safety threshold.">
              <TextField
                      fullWidth
                      label="Target Balance (CHF)"
                type="number"
                value={state.savings.targetAmount}
                onChange={(e) => handleTargetAmountUpdate(e.target.value)}
                sx={{ 
                        '& .MuiInputLabel-root': { fontSize: '1.2rem' },
                        '& .MuiInputBase-input': { fontSize: '1.3rem', py: 2 }
                }}
                placeholder="Minimum balance (safety threshold)"
              />
            </Tooltip>
                </Grid>
              </Grid>
          </Paper>
        </Grid>

          {/* Income Management Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '2rem' }}>Income Sources</Typography>
                <Grid container spacing={2} alignItems="center" sx={{ maxWidth: 400 }}>
                  <Grid item xs={6}>
                    <input
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      ref={incomeFileInputRef}
                      onChange={handleIncomeFileUpload}
                    />
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => incomeFileInputRef.current.click()}
                      sx={{ fontSize: '1.1rem', py: 1.5 }}
                    >
                      Import CSV
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingIncome(null);
                        setIncomeErrors({});
                        setOpenIncomeDialog(true);
                      }}
                      sx={{ fontSize: '1.1rem', py: 1.5 }}
                    >
                      Add Income
                    </Button>
                  </Grid>
                </Grid>
              </div>
              
              {state.income.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>No income sources added yet</Typography>
                  <Typography variant="body1">Click "Add Income" to get started with your financial planning</Typography>
                </Box>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Person</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Source</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Frequency</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Amount (CHF)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Schedule</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {state.income.map((income) => (
                        <TableRow key={income.id}>
                          <TableCell sx={{ fontSize: '1.1rem' }}>{income.person}</TableCell>
                          <TableCell sx={{ fontSize: '1.1rem' }}>{income.source}</TableCell>
                          <TableCell sx={{ fontSize: '1.1rem' }}>{income.frequency}</TableCell>
                          <TableCell sx={{ fontSize: '1.1rem' }}>
                            {income.amount.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                          </TableCell>
                          <TableCell sx={{ fontSize: '1.1rem' }}>
                            {income.frequency === 'Monthly' ? 'Monthly' : income.startDate}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => {
                                setEditingIncome(income);
                                setNewIncome(income);
                                setIncomeErrors({});
                                setOpenIncomeDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteIncome(income.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Paper>
          </Grid>

          {/* Expense Management Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '2rem' }}>Expenses</Typography>
                <Grid container spacing={2} alignItems="center" sx={{ maxWidth: 500 }}>
                  <Grid item xs={4}>
                    <input
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => fileInputRef.current.click()}
                      sx={{ fontSize: '1.1rem', py: 1.5 }}
                    >
                      Import
                    </Button>
                  </Grid>
                  <Grid item xs={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleExportCSV}
                      sx={{ fontSize: '1.1rem', py: 1.5 }}
                    >
                      Export
                    </Button>
                  </Grid>
                  <Grid item xs={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingExpense(null);
                        setErrors({});
                        setOpenDialog(true);
                      }}
                      sx={{ fontSize: '1.1rem', py: 1.5 }}
                    >
                      Add Expense
                    </Button>
                  </Grid>
                </Grid>
              </div>

              {/* Filter and Summary */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filter Expenses</InputLabel>
                  <Select
                    value={expenseFilter}
                    label="Filter Expenses"
                    onChange={(e) => setExpenseFilter(e.target.value)}
                    sx={{ fontSize: '1.1rem' }}
                  >
                    <MenuItem value="all">All Expenses</MenuItem>
                    <MenuItem value="regular">Regular Payments Only</MenuItem>
                    <MenuItem value="oneoff">One-off Payments Only</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                    Total Monthly: {totalSavingsNeeded.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {state.expenses.length} expense(s) configured
                  </Typography>
                </Box>
              </Box>
              
              {state.expenses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>No expenses added yet</Typography>
                  <Typography variant="body1">Click "Add Expense" to start tracking your financial obligations</Typography>
                </Box>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 1200 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Recurrence</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Monthly Equivalent</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Next Due</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getSortedExpenses(getFilteredExpenses(state.expenses, expenseFilter), monthlyBillsSort).map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell sx={{ fontSize: '1.1rem' }}>{expense.category}</TableCell>
                          <TableCell sx={{ fontSize: '1.1rem' }}>{expense.description}</TableCell>
                          <TableCell sx={{ fontSize: '1.1rem' }}>
                            {expense.amount.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                          </TableCell>
                          <TableCell sx={{ fontSize: '1.1rem' }}>{expense.recurrence}</TableCell>
                          <TableCell sx={{ fontSize: '1.1rem' }}>
                            {calculateMonthlyEquivalent(expense).toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                          </TableCell>
                          <TableCell sx={{ fontSize: '1.1rem' }}>{getNextDueDate(expense)}</TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => {
                                let expenseToEdit = { ...expense };
                                if (expense.recurrence === 'One-off' && !expense.oneOffDate && expense.paymentSchedule) {
                                  const [day, month] = expense.paymentSchedule.split('.');
                                  const today = new Date();
                                  let year = today.getFullYear();
                                  const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                  let testDate = new Date(dateString + 'T00:00:00.000Z');
                                  if (testDate < today) {
                                    year = year + 1;
                                  }
                                  expenseToEdit.oneOffDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                                }
                                setEditingExpense(expenseToEdit);
                                setNewExpense(expenseToEdit);
                                setErrors({});
                                setOpenDialog(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteExpense(expense.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Output Tab Content */}
      {mainTab === 1 && (
        <Grid container spacing={3}>
          {/* Instructions Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, fontSize: '1.8rem' }}>
                📊 View Your Financial Results
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.2rem', mb: 2 }}>
                This tab shows your calculated financial projections, charts, and detailed breakdowns. 
                Use the tabs below to explore different views of your financial plan.
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '1.1rem', fontStyle: 'italic' }}>
                💡 Tip: Switch back to the "Input Data" tab to modify your financial information and see updated results.
              </Typography>
            </Paper>
          </Grid>

          {/* Results Tabs Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 0 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                '& .MuiTab-root': { 
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  py: 2
                }
              }}
            >
              <Tab 
                icon={<ReceiptIcon />} 
                label="Regular Payments" 
                iconPosition="start"
              />
              <Tab 
                icon={<TimelineIcon />} 
                label="One-off Payments Timeline" 
                iconPosition="start"
              />
              <Tab 
                icon={<AssessmentIcon />} 
                label="Combined Overview" 
                iconPosition="start"
              />
            </Tabs>
            
            {/* Tab Content */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Regular Monthly Payments
                </Typography>
                <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                  These are your recurring expenses that occur monthly, annually, or on irregular schedules. 
                  The monthly equivalent is calculated and added to your regular savings requirement.
                </Typography>
                
                {/* Regular Expenses Table */}
                <Table sx={{ minWidth: 650, mb: 3 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Recurrence</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Monthly Equivalent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {state.expenses
                      .filter(exp => exp.recurrence === 'Monthly' || exp.recurrence === 'Annual' || exp.recurrence === 'Irregular')
                      .map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>
                            {expense.amount.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                          </TableCell>
                          <TableCell>{expense.recurrence}</TableCell>
                          <TableCell>
                            {expense.recurrence === 'Monthly' 
                              ? expense.amount.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })
                              : calculateMonthlyEquivalent(expense).toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                      <TableCell colSpan={4} sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                        Total Monthly Regular Savings Required
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                        {regularSavingsNeeded.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  One-off Payments Timeline
                </Typography>
                <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                  These are one-time payments that need to be saved for over time. 
                  Each payment is broken down into monthly contributions until the due date.
                </Typography>
                
                {oneOffTimeline.length === 0 ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No one-off payments scheduled. Add some using the "Add Expense" button below.
                  </Typography>
                ) : (
                  <Table sx={{ minWidth: 650, mb: 3 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Months Until Due</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Monthly Contribution</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {oneOffTimeline.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>
                            {item.expenseAmount.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                          </TableCell>
                          <TableCell>{item.monthName}</TableCell>
                          <TableCell>{item.monthsUntil}</TableCell>
                          <TableCell>
                            {item.monthlyContribution.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                        <TableCell colSpan={4} sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                          Total Monthly One-off Savings Required
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {oneOffSavingsNeeded.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}
            
            {activeTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                  Combined Financial Overview
                </Typography>
                
                {/* Chart Section */}
                <Box sx={{ mb: 4 }}>
            <SavingsChart 
              monthlyCalculation={monthlyCalculation}
            />
                </Box>

                {/* Financial Dashboard */}
          <FinancialDashboard 
            income={state.income}
            expenses={state.expenses}
          />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Collapsible Monthly Calculation Table */}
        {monthlyCalculation.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, fontSize: { xs: '2rem', sm: '4rem', md: '5rem' } }}>Buffer saving account calculation details</Typography>
                <IconButton onClick={() => setShowMonthlyDetails(v => !v)} size="large">
                  {showMonthlyDetails ? <ExpandLess sx={{ fontSize: 28 }} /> : <ExpandMore sx={{ fontSize: 28 }} />}
                </IconButton>
              </div>
              {showMonthlyDetails && (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <Typography variant="body1" paragraph sx={{ mb: 2 }}>
                    Note: Monthly savings amounts may vary to accommodate one-off expenses while keeping your buffer account above the minimum level.
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ mb: 2 }}>
                    <strong>How this works:</strong> Your account balance is maintained at or above your target balance at all times. 
                    Monthly savings remain constant except following a one-off payment, when the system recalculates the required savings 
                    amount to ensure financial stability.
                  </Typography>
                  <Table size="small" sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Month</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Start Balance</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: '#f5f5f5' }}>Monthly Saving</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Expenses</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total Expenses</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>End Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyCalculation.map((row, idx) => {
                        // Determine if this month's saving amount differs from previous
                        const prevSaving = idx > 0 ? monthlyCalculation[idx-1].monthlySaving : null;
                        const savingChanged = prevSaving !== null && Math.abs(row.monthlySaving - prevSaving) > 0.01;
                        const isSmoothingAdjustment = row.isSmoothingAdjustment;
                        const isEmergencyProtection = row.isEmergencyProtection;
                        const smoothingAmount = row.smoothingAmount || 0;
                        // Highlight months with any expenses
                        const hasOneOffExpense = row.hasSignificantExpense;
                        const hasRegularExpense = row.hasRegularExpense;
                        const hasAnyExpense = row.hasAnyExpense;
                        // Check if this is an adjustment month after a one-off payment
                        const isAdjustmentMonth = row.isAdjustingToInitial === true;
                        return (
                          <TableRow key={idx} sx={{ 
                            backgroundColor: hasOneOffExpense 
                              ? 'rgba(255, 235, 235, 0.3)' // Red for one-off expenses
                              : hasRegularExpense
                                ? 'rgba(255, 255, 235, 0.3)' // Yellow for regular expenses
                              : isAdjustmentMonth 
                                  ? 'rgba(230, 255, 230, 0.3)' // Green for adjustment months
                                : 'inherit'
                          }}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.startBalance.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</TableCell>
                            <TableCell sx={{ 
                              backgroundColor: savingChanged || isAdjustmentMonth || isSmoothingAdjustment || isEmergencyProtection
                                ? 'rgba(255, 255, 200, 0.5)' 
                                : row.hasExtraSavings ? 'rgba(230, 230, 255, 0.3)' : 'inherit',
                              fontWeight: savingChanged || isAdjustmentMonth || isSmoothingAdjustment || isEmergencyProtection ? 'bold' : 'normal'
                            }}>
                              {row.monthlySaving.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                              {savingChanged && row.monthlySaving > prevSaving && 
                                <span style={{ color: 'green', marginLeft: '5px' }}>↑</span>}
                              {savingChanged && row.monthlySaving < prevSaving && 
                                <span style={{ color: 'blue', marginLeft: '5px' }}>↓</span>}
                              {isAdjustmentMonth && 
                                <span style={{ color: 'purple', marginLeft: '5px' }}>★</span>}
                              {isSmoothingAdjustment && smoothingAmount > 0 && 
                                <span style={{ color: 'orange', marginLeft: '5px' }}>⚡</span>}
                              {isSmoothingAdjustment && smoothingAmount < 0 && 
                                <span style={{ color: 'teal', marginLeft: '5px' }}>⚡</span>}
                              {isEmergencyProtection && 
                                <span style={{ color: 'red', marginLeft: '5px' }}>🚨</span>}
                              {row.hasExtraSavings && 
                                <span style={{ color: 'teal', marginLeft: '5px' }}>†</span>}
                            </TableCell>
                            <TableCell sx={{ 
                              color: hasOneOffExpense ? 'red' : hasRegularExpense ? 'orange' : 'inherit',
                              fontWeight: hasAnyExpense ? 'bold' : 'normal'
                            }}>
                              {hasOneOffExpense && <span style={{ marginRight: '5px' }}>🔴</span>}
                              {hasRegularExpense && !hasOneOffExpense && <span style={{ marginRight: '5px' }}>🟡</span>}
                              {row.expenses.length > 0 ? row.expenses.join(', ') : 'None'}
                            </TableCell>
                            <TableCell sx={{ 
                              color: hasOneOffExpense ? 'red' : hasRegularExpense ? 'orange' : 'inherit',
                              fontWeight: hasAnyExpense ? 'bold' : 'normal'
                            }}>
                              {row.totalExpenses.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                            </TableCell>
                            <TableCell sx={{
                              backgroundColor: row.belowTargetBalance ? 'rgba(255, 200, 200, 0.3)' : 'inherit',
                              fontWeight: row.belowTargetBalance ? 'bold' : 'normal'
                            }}>
                              {row.endBalance.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                              {row.belowTargetBalance && 
                                <span style={{ color: 'red', marginLeft: '5px' }}>⚠️</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {/* Legend for the table symbols and highlighting */}
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #ddd' }}>
                    <Typography variant="h6" gutterBottom>Legend:</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 235, 235, 0.3)', mr: 1, border: '1px solid #ddd' }} />
                          <Typography variant="body2">Month with one-off expense (red)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 255, 235, 0.3)', mr: 1, border: '1px solid #ddd' }} />
                          <Typography variant="body2">Month with regular expense (yellow)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(230, 255, 230, 0.3)', mr: 1, border: '1px solid #ddd' }} />
                          <Typography variant="body2">Month with savings adjustment after one-off payment</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 255, 200, 0.5)', mr: 1, border: '1px solid #ddd' }} />
                          <Typography variant="body2">Changed monthly savings amount</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(230, 230, 255, 0.3)', mr: 1, border: '1px solid #ddd' }} />
                          <Typography variant="body2">Temporary savings increase to maintain target balance</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>🔴</Typography>
                          <Typography variant="body2">One-off expense</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>🟡</Typography>
                          <Typography variant="body2">Regular expense (annual/irregular)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>⚠️</Typography>
                          <Typography variant="body2">Below target balance warning</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>↑</Typography>
                          <Typography variant="body2">Increased monthly savings</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>↓</Typography>
                          <Typography variant="body2">Decreased monthly savings</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1, color: 'purple' }}>★</Typography>
                          <Typography variant="body2">Monthly savings adjusted after one-off payment</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1, color: 'teal' }}>†</Typography>
                          <Typography variant="body2">Extra savings to maintain target balance</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1, color: 'orange' }}>⚡</Typography>
                          <Typography variant="body2">Smoothing adjustment (gradual increase)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1, color: 'teal' }}>⚡</Typography>
                          <Typography variant="body2">Smoothing adjustment (gradual decrease)</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 1, color: 'red' }}>🚨</Typography>
                          <Typography variant="body2">Emergency protection (prevents balance below target)</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </div>
              )}
            </Paper>
          </Grid>
        )}

        {/* Monthly Bill Details Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, fontSize: { xs: '2rem', sm: '4rem', md: '5rem' } }}>Monthly Bill Details</Typography>
              <IconButton onClick={() => setShowMonthlyBills(v => !v)} size="large">
                {showMonthlyBills ? <ExpandLess sx={{ fontSize: 28 }} /> : <ExpandMore sx={{ fontSize: 28 }} />}
              </IconButton>
            </div>
            {showMonthlyBills && (
              <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                            <TableSortLabel
                              active={monthlyBillsSort.field === 'category'}
                              direction={monthlyBillsSort.field === 'category' ? monthlyBillsSort.direction : 'asc'}
                              onClick={() => handleSortRequest('category')}
                            >
                              Category
                            </TableSortLabel>
                          </TableCell>
                          <TableCell sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                            <TableSortLabel
                              active={monthlyBillsSort.field === 'subcategory'}
                              direction={monthlyBillsSort.field === 'subcategory' ? monthlyBillsSort.direction : 'asc'}
                              onClick={() => handleSortRequest('subcategory')}
                            >
                              Subcategory
                            </TableSortLabel>
                          </TableCell>
                          <TableCell sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                            <TableSortLabel
                              active={monthlyBillsSort.field === 'description'}
                              direction={monthlyBillsSort.field === 'description' ? monthlyBillsSort.direction : 'asc'}
                              onClick={() => handleSortRequest('description')}
                            >
                              Description
                            </TableSortLabel>
                          </TableCell>
                          <TableCell sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                            <TableSortLabel
                              active={monthlyBillsSort.field === 'amount'}
                              direction={monthlyBillsSort.field === 'amount' ? monthlyBillsSort.direction : 'asc'}
                              onClick={() => handleSortRequest('amount')}
                            >
                              Amount (CHF)
                            </TableSortLabel>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Regular Monthly Bills - Now with sorting */}
                        {getSortedExpenses(
                          [
                            ...state.expenses.filter(exp => exp.recurrence === 'Monthly'),
                            ...state.expenses.filter(exp => exp.recurrence === 'Annual' || exp.recurrence === 'Irregular')
                          ],
                          monthlyBillsSort
                        ).map((exp, idx) => {
                          const isMonthly = exp.recurrence === 'Monthly';
                          const amount = isMonthly 
                            ? parseFloat(exp.amount) 
                            : calculateMonthlyEquivalent(exp);
                          
                          return (
                            <TableRow key={`expense-${exp.id || idx}`}>
                              <TableCell sx={{ fontSize: '1.3rem' }}>{exp.category}</TableCell>
                              <TableCell sx={{ fontSize: '1.3rem' }}>{exp.subcategory}</TableCell>
                              <TableCell sx={{ fontSize: '1.3rem' }}>{exp.description}</TableCell>
                              <TableCell sx={{ fontSize: '1.3rem' }}>
                                {amount.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {/* Combined Total row */}
                        <TableRow>
                          <TableCell colSpan={3} sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Total Monthly Expenses</TableCell>
                          <TableCell sx={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                            {(
                              state.expenses.filter(exp => exp.recurrence === 'Monthly').reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) +
                              state.expenses.filter(exp => exp.recurrence === 'Annual' || exp.recurrence === 'Irregular')
                                .reduce((sum, exp) => sum + calculateMonthlyEquivalent(exp), 0)
                            ).toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Grid>
                
                <Grid item xs={12} lg={6}>
                  <Typography variant="h6" align="center" gutterBottom sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    Total Monthly Spending by Category
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <MonthlyBillsPieChart expenses={state.expenses} />
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

          {/* Detailed Expenses Table Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, fontSize: { xs: '2rem', sm: '4rem', md: '5rem' } }}>Detailed Expenses View</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Filter Expenses</InputLabel>
                    <Select
                      value={expenseFilter}
                      label="Filter Expenses"
                      onChange={(e) => setExpenseFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Expenses</MenuItem>
                      <MenuItem value="regular">Regular Payments Only</MenuItem>
                      <MenuItem value="oneoff">One-off Payments Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button
                      variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current.click()}
                  >
                    Import CSV
                  </Button>
                  <Button
                      variant="outlined"
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingExpense(null);
                      setErrors({});
                      setOpenDialog(true);
                    }}
                  >
                    Add Expense
                  </Button>
                </Grid>
              </Grid>
            </div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 1200 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Subcategory</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount (CHF)</TableCell>
                    <TableCell>Recurrence</TableCell>
                    <TableCell>Monthly Equivalent</TableCell>
                    <TableCell>Payment Schedule</TableCell>
                    <TableCell>Next Due Date</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getSortedExpenses(getFilteredExpenses(state.expenses, expenseFilter), monthlyBillsSort).map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.subcategory}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.amount.toLocaleString('de-CH', {
                        style: 'currency',
                        currency: 'CHF'
                      })}</TableCell>
                      <TableCell>{expense.recurrence}</TableCell>
                      <TableCell>{calculateMonthlyEquivalent(expense).toLocaleString('de-CH', {
                        style: 'currency',
                        currency: 'CHF'
                      })}</TableCell>
                      <TableCell>{expense.paymentSchedule}</TableCell>
                      <TableCell>{getNextDueDate(expense)}</TableCell>
                      <TableCell>{generateNotes(expense)}</TableCell>
                      <TableCell>{expense.startDate}</TableCell>
                      <TableCell>{expense.endDate}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => {
                            console.log('=== EDIT DIALOG DEBUG ===');
                            console.log('Raw expense object:', expense);
                            console.log('expense.recurrence:', expense.recurrence);
                            console.log('expense.oneOffDate:', expense.oneOffDate);
                            console.log('expense.paymentSchedule:', expense.paymentSchedule);
                            
                            // Fix: If this is a one-off expense but doesn't have oneOffDate, reconstruct it from paymentSchedule
                            let expenseToEdit = { ...expense };
                            if (expense.recurrence === 'One-off' && !expense.oneOffDate && expense.paymentSchedule) {
                              console.log('🔧 RECONSTRUCTING DATE...');
                              const [day, month] = expense.paymentSchedule.split('.');
                              const today = new Date();
                              let year = today.getFullYear();
                              
                              console.log(`Parsed from "${expense.paymentSchedule}": day=${day}, month=${month}`);
                              console.log(`Today: ${today.toISOString()}`);
                              console.log(`Initial year: ${year}`);
                              
                              // Use same logic as getNextDueDate - create UTC date string to avoid timezone issues
                              const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                              let testDate = new Date(dateString + 'T00:00:00.000Z'); // Force UTC
                              
                              console.log(`Initial date string: ${dateString}`);
                              console.log(`Test date: ${testDate.toISOString()}`);
                              console.log(`Has this date passed? ${testDate < today}`);
                              
                              // Check if the date has passed this year, if so, use next year
                              if (testDate < today) {
                                year = year + 1;
                                console.log(`Date has passed, using next year: ${year}`);
                              }
                              
                              expenseToEdit.oneOffDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                              console.log(`🎯 FINAL reconstructed oneOffDate: ${expenseToEdit.oneOffDate}`);
                            } else {
                              console.log('❌ NOT reconstructing because:');
                              console.log(`  - recurrence is One-off: ${expense.recurrence === 'One-off'}`);
                              console.log(`  - oneOffDate is missing: ${!expense.oneOffDate}`);
                              console.log(`  - paymentSchedule exists: ${!!expense.paymentSchedule}`);
                            }
                            
                            console.log('Final expenseToEdit object:', expenseToEdit);
                            console.log('=== END DEBUG ===');
                            
                            setEditingExpense(expenseToEdit);
                            setNewExpense(expenseToEdit);
                            setErrors({});
                            setOpenDialog(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteExpense(expense.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </Grid>

        {/* Income Table Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '2rem', sm: '4rem', md: '5rem' } }}>Income Overview</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    ref={incomeFileInputRef}
                    onChange={handleIncomeFileUpload}
                  />
                  <Button
                      variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => incomeFileInputRef.current.click()}
                  >
                    Import CSV
                  </Button>
                  <Button
                      variant="outlined"
                    onClick={handleExportIncomeCSV}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingIncome(null);
                      setIncomeErrors({});
                      setOpenIncomeDialog(true);
                    }}
                  >
                    Add Income
                  </Button>
                </Grid>
              </Grid>
            </div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Person</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Amount (CHF)</TableCell>
                    <TableCell>Income Schedule</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.income.map((income) => (
                    <TableRow key={income.id}>
                      <TableCell>{income.person}</TableCell>
                      <TableCell>{income.source}</TableCell>
                      <TableCell>{income.frequency}</TableCell>
                      <TableCell>{income.amount.toLocaleString('de-CH', {
                        style: 'currency',
                        currency: 'CHF'
                      })}</TableCell>
                      <TableCell>
                        {income.frequency === 'Monthly' ? 'Monthly' : income.startDate}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => {
                            setEditingIncome(income);
                            setNewIncome(income);
                            setIncomeErrors({});
                            setOpenIncomeDialog(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteIncome(income.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </Grid>

        {/* Web App Description Section */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '2rem', sm: '4rem', md: '5rem' } }}>Web App Description</Typography>
                <IconButton onClick={() => setShowWebAppDescription(v => !v)} size="large">
                  {showWebAppDescription ? <ExpandLess sx={{ fontSize: 28 }} /> : <ExpandMore sx={{ fontSize: 28 }} />}
                </IconButton>
              </div>
              {showWebAppDescription && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Purpose and Overview</Typography>
                    <Typography paragraph>
                      The Savings Planner is a comprehensive financial management tool designed to help you track, plan, and visualize your savings goals. This application provides detailed insights into your financial situation by analyzing your income and expenses, calculating the monthly savings needed to meet your goals, and projecting your savings growth over time.
                    </Typography>
                    
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}>Core Calculations</Typography>
                    <Typography paragraph>
                      <strong>Dynamic Forward-Looking Calculation:</strong> The app uses a sophisticated dynamic calculation method that analyzes the entire planning period (up to 5 years) and determines the optimal monthly savings required to maintain the target balance throughout all months:
                    </Typography>
                    <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          <strong>Comprehensive Analysis:</strong> The system analyzes the entire planning period (up to 5 years) and simulates different monthly savings amounts to find the minimum that ensures the balance never falls below the target level.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Dynamic Testing:</strong> The algorithm tests monthly savings amounts from 1,000 CHF to 20,000 CHF in 100 CHF increments to find the optimal amount that maintains financial stability throughout the entire period.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Balance Guarantee:</strong> The calculated monthly savings ensures that the account balance never falls below the target level, even when multiple large expenses occur in sequence.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Expense Integration:</strong> All regular expenses (annual, irregular) and one-off expenses are considered in the calculation, ensuring comprehensive financial planning.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Optimal Efficiency:</strong> The system finds the minimum monthly savings required, avoiding over-saving while ensuring financial security.
                        </Typography>
                      </li>
                    </ul>

                    <Typography paragraph>
                      <strong>Key Advantage:</strong> This dynamic approach guarantees that your account balance never falls below the target level, even when facing multiple large expenses over an extended period. Unlike reactive methods that try to fix problems after they occur, this system prevents problems from happening in the first place by calculating the optimal monthly savings upfront.
                    </Typography>

                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}>Monthly Expense Handling</Typography>
                    <Typography paragraph>
                      The app processes expenses differently based on their recurrence type:
                    </Typography>
                    <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          <strong>Monthly Expenses:</strong> Treated as regular outflows that occur every month.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Annual Expenses:</strong> Spread across the year for savings calculation purposes but recognized as lump-sum payments on their due dates.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Irregular Expenses:</strong> Processed based on the specified payment schedule (e.g., "15.3;15.9" for payments on March 15 and September 15).
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>One-off Expenses:</strong> Scheduled for a specific date and integrated into the savings projection.
                        </Typography>
                      </li>
                    </ul>

                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}>Practical Examples</Typography>
                    
                    <Typography paragraph>
                      <strong>Example 1: Integrated One-Off Planning</strong>
                    </Typography>
                    <Typography paragraph sx={{ ml: 3 }}>
                      Imagine you have two upcoming one-off expenses: a 3,000 CHF holiday in 12 months and a 6,000 CHF car repair in 18 months. The app will immediately calculate:
                    </Typography>
                    <ul style={{ marginLeft: '40px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          Holiday contribution: 3,000 CHF ÷ 12 months = 250 CHF/month
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Car repair contribution: 6,000 CHF ÷ 18 months = 333 CHF/month
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Plus baseline savings for recurring expenses: e.g., 100 CHF/month
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Total monthly savings: 683 CHF/month</strong>
                        </Typography>
                      </li>
                    </ul>
                    <Typography paragraph sx={{ ml: 3 }}>
                      After 12 months when you pay for the holiday:
                    </Typography>
                    <ul style={{ marginLeft: '40px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          The 250 CHF/month holiday contribution is removed
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Car repair still needs 6 months: 6,000 CHF ÷ 6 months = 1,000 CHF/month
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>New monthly savings: 1,100 CHF/month (1,000 + 100 baseline)</strong>
                        </Typography>
                      </li>
                    </ul>
                    <Typography paragraph sx={{ ml: 3 }}>
                      After 18 months when the car repair is paid, monthly savings drop to just the baseline: 100 CHF/month.
                    </Typography>

                    <Typography paragraph>
                      <strong>Example 2: 2-Year Cycle Recovery</strong>
                    </Typography>
                    <Typography paragraph sx={{ ml: 3 }}>
                      Consider a 5,000 CHF one-off expense due in 12 months. With the 2-year cycle recovery system:
                    </Typography>
                    <ul style={{ marginLeft: '40px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          Initial calculation: 5,000 CHF ÷ (12 + 24) months = 139 CHF/month
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          After 12 months: Payment of 5,000 CHF is made, balance drops
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Recovery period: Next 24 months dedicated to recovering to target balance
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Result:</strong> Balance returns close to target within 2 years of the payment
                        </Typography>
                      </li>
                    </ul>

                    <Typography paragraph>
                      <strong>Example 3: Emergency Protection</strong>
                    </Typography>
                    <Typography paragraph sx={{ ml: 3 }}>
                      Consider a scenario where a large unexpected expense occurs:
                    </Typography>
                    <ul style={{ marginLeft: '40px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          Current balance: 20,000 CHF, Target balance: 15,000 CHF
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Large expense: 30,000 CHF (e.g., emergency home repair)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Without protection: Balance would drop to -10,000 CHF
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          With emergency protection: System detects risk and increases monthly savings to recover within 12 months
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Result:</strong> Balance is protected and recovers to target level
                        </Typography>
                      </li>
                    </ul>

                    <Typography paragraph>
                      <strong>Example 4: Proactive Protection</strong>
                    </Typography>
                    <Typography paragraph sx={{ ml: 3 }}>
                      Consider a scenario where a large scheduled expense is approaching:
                    </Typography>
                    <ul style={{ marginLeft: '40px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          Current balance: 23,200 CHF, Target balance: 15,000 CHF
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Large scheduled expense: 29,920 CHF (e.g., driveway construction)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Buffer remaining: 8,200 CHF (23,200 - 15,000)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Proactive detection: System detects expense > 30% of buffer (29,920 > 2,460)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Proactive protection: System increases monthly savings to prevent balance from going below target
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Result:</strong> Balance stays above target even after large expense
                        </Typography>
                      </li>
                    </ul>

                    <Typography paragraph>
                      <strong>Example 5: Safety Buffer Protection</strong>
                    </Typography>
                    <Typography paragraph sx={{ ml: 3 }}>
                      Consider a scenario where the balance is getting too close to the target:
                    </Typography>
                    <ul style={{ marginLeft: '40px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          Current balance: 17,500 CHF, Target balance: 15,000 CHF
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Safety buffer: 3,000 CHF (20% of target)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Safety threshold: 18,000 CHF (target + safety buffer)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Safety detection: Current balance (17,500) &lt; Safety threshold (18,000)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Safety protection: System increases monthly savings to restore safety buffer within 3 months
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Result:</strong> Balance is maintained well above target level for long-term stability
                        </Typography>
                      </li>
                    </ul>

                    <Typography paragraph>
                      <strong>Example 6: Minimum Balance Guarantee</strong>
                    </Typography>
                    <Typography paragraph sx={{ ml: 3 }}>
                      Consider a scenario where a large expense would cause the projected balance to be too low:
                    </Typography>
                    <ul style={{ marginLeft: '40px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          Current balance: 20,000 CHF, Target balance: 15,000 CHF
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Large expense: 25,000 CHF (e.g., major home renovation)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Current monthly savings: 5,000 CHF
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Projected balance after expense: 0 CHF (20,000 + 5,000 - 25,000)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Minimum safe balance: 22,500 CHF (target + 50%)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Guarantee detection: Projected balance (0) &lt; Minimum safe balance (22,500)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Guarantee protection: System increases monthly savings to ensure balance stays above minimum safe level
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Result:</strong> Balance never falls below the minimum safe level, preventing future negative balances
                        </Typography>
                      </li>
                    </ul>

                    <Typography paragraph>
                      <strong>Example 2: Car Insurance Calculation</strong>
                    </Typography>
                    <Typography paragraph sx={{ ml: 3 }}>
                      Let's say your annual car insurance premium of 1,200 CHF is due every September 15th:
                    </Typography>
                    <ul style={{ marginLeft: '40px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          Category: Insurance
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Subcategory: Car
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Description: Annual Car Insurance Premium
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Amount: 1,200 CHF
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Recurrence: Annual
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Payment Schedule: 15.09 (September 15th)
                        </Typography>
                      </li>
                    </ul>
                    <Typography paragraph sx={{ ml: 3 }}>
                      The application will:
                    </Typography>
                    <ul style={{ marginLeft: '40px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          Calculate that you need to save 100 CHF monthly (1,200 CHF ÷ 12 months)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Add this amount to your total monthly savings target
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Account for this payment in your projected savings balance, showing a drop of 1,200 CHF every September
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Ensure your buffer never drops below zero by recommending adequate monthly savings
                        </Typography>
                      </li>
                    </ul>

                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}>Financial Planning Requirements</Typography>
                    <Typography paragraph>
                      This application follows these strict financial planning requirements:
                    </Typography>
                    <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          <strong>Primary Requirement:</strong> Account balance never falls below the specified target amount to maintain financial security.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Secondary Requirement:</strong> Monthly savings amounts remain constant throughout standard payment cycles, changing only after one-off payments to rebalance your budget.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>2-Year Cycle Recovery:</strong> After each one-off payment, the balance must return close to the target balance within 24 months to ensure long-term financial stability and prevent cumulative balance depletion.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Emergency Protection:</strong> The system continuously monitors the balance and automatically increases monthly savings when the balance is at risk of falling below the target level, ensuring the account never goes below the minimum balance.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Proactive Protection:</strong> The system detects large expenses before they occur and proactively increases monthly savings to prevent the balance from going below the target level, even when large one-off payments are scheduled.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Safety Buffer Protection:</strong> The system maintains a 20% safety buffer above the target balance and automatically increases monthly savings when the balance gets too close to the target level, ensuring long-term financial stability.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Minimum Balance Guarantee:</strong> The system ensures the projected balance never falls below 50% above the target level by proactively adjusting monthly savings when large expenses would cause the balance to get too low.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Tertiary Requirement:</strong> Save exactly what you need for future expenses and maintaining your safety buffer, no more and no less. This prevents unnecessary overgrowth of account balances, especially after year 3.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Safety Mechanism:</strong> The application dynamically adjusts savings rates at the beginning of each period to ensure you have just enough for upcoming expenses plus a minimum buffer.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          <strong>Balance Control:</strong> In later years (year 3+), the algorithm uses a more aggressive approach to limit balance growth, calculating precisely how much you need to save to cover upcoming expenses without excess accumulation.
                        </Typography>
                      </li>
                    </ul>

                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 3 }}>How to Use This Application</Typography>
                    <Typography paragraph>
                      <strong>1. Initial Setup:</strong>
                    </Typography>
                    <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          Enter your current savings amount in the "Current Savings" field at the top.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Add your income sources using the "Add Income" button in the Income section.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Add all your recurring and future expenses using the "Add Expense" button.
                        </Typography>
                      </li>
                    </ul>

                    <Typography paragraph>
                      <strong>2. Expense Management:</strong>
                    </Typography>
                    <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          For monthly expenses, simply enter the amount and select "Monthly" as the recurrence.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          For annual expenses, enter the full amount and select "Annual" as the recurrence.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          For irregular payments, use the payment schedule field to specify dates in the format "DD.MM" separated by semicolons (e.g., "15.3;15.9").
                        </Typography>
                      </li>
                    </ul>

                    <Typography paragraph>
                      <strong>3. Using the Visualizations:</strong>
                    </Typography>
                    <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          The main chart shows your projected savings balance over time, including all planned expenses.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          The Financial Dashboard provides a quick overview of your monthly income vs. expenses.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          The Monthly Bills section shows a detailed breakdown of all your expenses.
                        </Typography>
                      </li>
                    </ul>

                    <Typography paragraph>
                      <strong>4. Data Import/Export:</strong>
                    </Typography>
                    <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                      <li>
                        <Typography>
                          You can import expenses and income from CSV files using the "Import CSV" buttons.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Export your current data to CSV for backup or analysis in other tools.
                        </Typography>
                      </li>
                    </ul>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
        </Grid>
        </Grid>
      )}

        {/* Add/Edit Expense Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ 
            sx: { 
              '& .MuiTypography-root': { fontSize: '1.2rem' },
              '& .MuiFormLabel-root': { fontSize: '1.1rem' },
              '& .MuiMenuItem-root': { fontSize: '1.1rem' },
              '& .MuiInputBase-input': { fontSize: '1.1rem' },
              '& .MuiButton-root': { fontSize: '1rem' }
            } 
          }}
        >
          <DialogTitle>
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.category}>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={newExpense.category}
                    label="Category *"
                    onChange={(e) => {
                      if (e.target.value === "add_new_category") {
                        setShowAddCategory(true);
                      } else {
                        setNewExpense({ ...newExpense, category: e.target.value });
                      }
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                    {customCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                    <MenuItem value="add_new_category" sx={{ fontStyle: 'italic' }}>
                      + Add new category
                    </MenuItem>
                  </Select>
                  {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                </FormControl>
                {showAddCategory && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="New Category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      size="small"
                      sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleAddCategory}
                      sx={{ fontSize: '1.1rem', height: '100%' }}
                    >
                      Add
                    </Button>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Subcategory"
                  value={newExpense.subcategory}
                  onChange={(e) => setNewExpense({ ...newExpense, subcategory: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount (CHF) *"
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  error={!!errors.amount}
                  helperText={errors.amount}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.recurrence}>
                  <InputLabel>Recurrence *</InputLabel>
                  <Select
                    value={newExpense.recurrence}
                    label="Recurrence *"
                    onChange={(e) => setNewExpense({ ...newExpense, recurrence: e.target.value })}
                  >
                    {recurrenceTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.recurrence && <FormHelperText>{errors.recurrence}</FormHelperText>}
                </FormControl>
              </Grid>
              {/* One-off: show only a date picker for payment date */}
              {newExpense.recurrence === 'One-off' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Payment Date *"
                    type="date"
                    value={newExpense.oneOffDate || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, oneOffDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.oneOffDate}
                    helperText={errors.oneOffDate || 'This payment will occur only once, on the selected date.'}
                  />
                </Grid>
              )}
              {/* Irregular: show payment schedule */}
              {newExpense.recurrence === 'Irregular' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Payment Schedule (DD.MM;DD.MM) *"
                    value={newExpense.paymentSchedule}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentSchedule: e.target.value })}
                    error={!!errors.paymentSchedule}
                    helperText={errors.paymentSchedule || "Enter dates in format: DD.MM;DD.MM (e.g., 10.03;10.05;10.07)"}
                  />
                </Grid>
              )}
              {/* Hide end date for one-off */}
              {newExpense.recurrence !== 'One-off' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={newExpense.endDate}
                    onChange={(e) => setNewExpense({ ...newExpense, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiInputBase-input': { fontSize: '1.5rem', padding: '16px' },
                      '& .MuiInputBase-root': { fontSize: '1.5rem' },
                      '& .MuiSvgIcon-root': { fontSize: '1.8rem' },
                      '& input[type="date"]::-webkit-calendar-picker-indicator': {
                        width: '2rem',
                        height: '2rem',
                        cursor: 'pointer'
                      },
                      '& input': {
                        padding: '16px 10px',
                        height: 'auto'
                      }
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={() => editingExpense ? handleEditExpense(newExpense) : handleAddExpense()}
              variant="contained"
            >
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Income Dialog */}
        <Dialog 
          open={openIncomeDialog} 
          onClose={() => setOpenIncomeDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ 
            sx: { 
              '& .MuiTypography-root': { fontSize: '1.2rem' },
              '& .MuiFormLabel-root': { fontSize: '1.1rem' },
              '& .MuiMenuItem-root': { fontSize: '1.1rem' },
              '& .MuiInputBase-input': { fontSize: '1.1rem' },
              '& .MuiButton-root': { fontSize: '1rem' }
            } 
          }}
        >
          <DialogTitle>
            {editingIncome ? 'Edit Income' : 'Add New Income'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Person *"
                  value={newIncome.person}
                  onChange={(e) => setNewIncome({ ...newIncome, person: e.target.value })}
                  error={!!incomeErrors.person}
                  helperText={incomeErrors.person}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Source *"
                  value={newIncome.source}
                  onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                  error={!!incomeErrors.source}
                  helperText={incomeErrors.source}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!incomeErrors.frequency}>
                  <InputLabel>Frequency *</InputLabel>
                  <Select
                    value={newIncome.frequency}
                    label="Frequency *"
                    onChange={(e) => setNewIncome({ ...newIncome, frequency: e.target.value, startDate: '', endDate: '' })}
                  >
                    {frequencyTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  {incomeErrors.frequency && <FormHelperText>{incomeErrors.frequency}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount (CHF) *"
                  type="number"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  error={!!incomeErrors.amount}
                  helperText={incomeErrors.amount}
                />
              </Grid>
              {newIncome.frequency === '1 off' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Income Date *"
                    value={newIncome.startDate}
                    onChange={(e) => setNewIncome({ ...newIncome, startDate: e.target.value })}
                    error={!!incomeErrors.startDate}
                    helperText={incomeErrors.startDate || "Format: DD.MM.YYYY"}
                    sx={{ 
                      '& .MuiInputBase-input': { fontSize: '1.5rem' },
                      '& .MuiInputBase-root': { fontSize: '1.5rem' },
                      '& .MuiSvgIcon-root': { fontSize: '1.8rem' }
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenIncomeDialog(false)}>Cancel</Button>
            <Button
              onClick={() => editingIncome ? handleEditIncome(newIncome) : handleAddIncome()}
              variant="contained"
            >
              {editingIncome ? 'Save Changes' : 'Add Income'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add global styles for calendar popups */}
        <style jsx global>{`
          .MuiCalendarPicker-root, 
          .MuiPickersDay-root, 
          .PrivatePickersMonth-root, 
          .PrivatePickersYear-root,
          .MuiTypography-caption,
          .MuiPickersCalendarHeader-label,
          .MuiPickersDay-dayLabel,
          .MuiDayPicker-header,
          .MuiPickersDay-day,
          .MuiButtonBase-root.MuiPickersDay-root {
            font-size: 1.5rem !important;
          }
          
          .MuiCalendarPicker-root button {
            font-size: 1.5rem !important;
          }
          
          .MuiPickersCalendarHeader-switchViewButton {
            font-size: 1.8rem !important;
          }

          /* Calendar popup styles */
          .react-datepicker,
          .react-datepicker__month-container,
          .react-datepicker__header,
          .react-datepicker__day-name,
          .react-datepicker__day,
          .react-datepicker__current-month {
            font-size: 1.5rem !important;
          }
          
          .react-datepicker__day {
            width: 2.5rem !important;
            height: 2.5rem !important;
            line-height: 2.5rem !important;
            margin: 0.2rem !important;
          }
          
          .react-datepicker__header {
            padding-top: 1rem !important;
          }
          
          /* Native calendar input styling */
          input[type="date"] {
            font-size: 1.5rem !important;
          }
          
          /* HTML date element calendar popup */
          ::-webkit-calendar-picker-indicator {
            width: 1.8rem !important;
            height: 1.8rem !important;
          }
          
          /* Target browser's native calendar popup */
          ::-webkit-datetime-edit { font-size: 1.5rem !important; }
          ::-webkit-datetime-edit-fields-wrapper { font-size: 1.5rem !important; }
          ::-webkit-datetime-edit-text { font-size: 1.5rem !important; }
          ::-webkit-datetime-edit-month-field { font-size: 1.5rem !important; }
          ::-webkit-datetime-edit-day-field { font-size: 1.5rem !important; }
          ::-webkit-datetime-edit-year-field { font-size: 1.5rem !important; }
          ::-webkit-inner-spin-button { font-size: 1.5rem !important; }
          ::-webkit-calendar-picker-indicator { font-size: 1.5rem !important; }
          
          /* Additional selectors to target browser-specific calendar parts */
          .calendar-popup-day, 
          .calendar-day, 
          .calendar-header,
          .calendar-month-header,
          .calendar-year-header,
          .calendar-navigation,
          .calendar-button,
          .calendar-day-header,
          .calendar-day-button,
          .calendar-month-button,
          .calendar-year-button,
          .calendar-today-button,
          .calendar-clear-button,
          td[role="gridcell"],
          table.calendar-table,
          div.calendar-container {
            font-size: 2rem !important;
            padding: 8px !important;
          }
        `}</style>
    </Container>
  );
};

export default SavingsPlanner; 