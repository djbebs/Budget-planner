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
  TableContainer,
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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Upload as UploadIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useFinancial } from '../context/FinancialContext';
import SavingsChart from '../components/SavingsChart';
import { saveAs } from 'file-saver';

const SavingsPlanner = () => {
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
  });
  const [monthlyCalculation, setMonthlyCalculation] = useState([]);
  const [showMonthlyDetails, setShowMonthlyDetails] = useState(false);

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

  const fileInputRef = useRef(null);

  const calculateMonthlyEquivalent = (expense) => {
    const amount = parseFloat(expense.amount);
    if (isNaN(amount)) return 0;

    switch (expense.recurrence) {
      case 'Annual':
        return amount / 12;
      case 'Irregular':
        const dates = expense.paymentSchedule?.split(';').filter(d => d) || [];
        return dates.length > 0 ? amount / dates.length / 12 : amount / 12;
      default:
        return 0;
    }
  };

  const calculateMonthlySavingsNeeded = (expenses) => {
    if (!expenses || expenses.length === 0) return 0;

    const monthsToProject = 24;
    const today = new Date();
    const startingBalance = parseFloat(state.savings.currentAmount) || 0;

    // Gather all annual and irregular expense events (date, amount, description)
    const allExpenses = [];
    expenses
      .filter(expense => expense.recurrence === 'Annual' || expense.recurrence === 'Irregular')
      .forEach(expense => {
        const amount = parseFloat(expense.amount);
        if (expense.recurrence === 'Annual') {
          const dueDate = new Date(expense.nextDueDate);
          for (let year = 0; year < 3; year++) {
            const expenseDate = new Date(today.getFullYear() + year, dueDate.getMonth(), dueDate.getDate() || 1);
            if (expenseDate >= today && expenseDate < new Date(today.getFullYear(), today.getMonth() + monthsToProject)) {
              allExpenses.push({
                date: expenseDate,
                amount: amount,
                description: expense.description
              });
            }
          }
        } else if (expense.recurrence === 'Irregular' && expense.paymentSchedule) {
          const dates = expense.paymentSchedule.split(';')
            .map(dateStr => {
              const [day, month] = dateStr.trim().split('.');
              return { month: parseInt(month) - 1, day: parseInt(day) };
            });
          dates.forEach(({ month, day }) => {
            for (let year = 0; year < 3; year++) {
              const expenseDate = new Date(today.getFullYear() + year, month, day);
              if (expenseDate >= today && expenseDate < new Date(today.getFullYear(), today.getMonth() + monthsToProject)) {
                allExpenses.push({
                  date: expenseDate,
                  amount: amount, // Each payment is for the full amount
                  description: expense.description
                });
              }
            }
          });
        }
      });
    allExpenses.sort((a, b) => a.date - b.date);

    // Binary search for the minimum monthly saving
    let low = 0, high = 100000, result = high;
    let bestMonthlyCalculation = [];
    while (high - low > 0.01) {
      let mid = (low + high) / 2;
      let balance = startingBalance;
      let ok = true;
      let monthlyCalc = [];
      for (let month = 0; month < monthsToProject; month++) {
        const currentDate = new Date(today.getFullYear(), today.getMonth() + month, 1);
        const expensesThisMonth = allExpenses.filter(exp => exp.date.getMonth() === currentDate.getMonth() && exp.date.getFullYear() === currentDate.getFullYear());
        const totalExpenses = expensesThisMonth.reduce((sum, exp) => sum + exp.amount, 0);
        const expenseDescriptions = expensesThisMonth.map(exp => `${exp.description}: ${exp.amount}`);
        const startBalance = balance;
        balance += mid;
        balance -= totalExpenses;
        monthlyCalc.push({
          month: currentDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
          startBalance: startBalance,
          monthlySaving: mid,
          expenses: expenseDescriptions,
          totalExpenses: totalExpenses,
          endBalance: balance
        });
        if (balance < 0) {
          ok = false;
          break;
        }
      }
      // Check if end of each year is close to zero (within 1 CHF)
      let yearOk = true;
      for (let m = 11; m < monthsToProject; m += 12) {
        if (monthlyCalc[m] && monthlyCalc[m].endBalance < -1) yearOk = false;
      }
      if (ok && yearOk) {
        result = mid;
        bestMonthlyCalculation = monthlyCalc;
        high = mid;
      } else {
        low = mid;
      }
    }
    setMonthlyCalculation(bestMonthlyCalculation);
    return Math.round(result * 100) / 100;
  };

  const getNextDueDate = (expense) => {
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
          let date = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
          
          // If the date has passed, move to next year
          if (date < today) {
            date = new Date(today.getFullYear() + 1, parseInt(month) - 1, parseInt(day));
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
    if ((expense.recurrence === 'Irregular' || expense.recurrence === 'One-off') && !expense.paymentSchedule) {
      newErrors.paymentSchedule = 'Payment schedule is required for Irregular/One-off payments';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateProjectedSavings = () => {
    const projectedPoints = [];
    let currentBalance = parseFloat(state.savings.currentAmount) || 0;
    const monthsToProject = 24;
    const monthlySavingsNeeded = calculateMonthlySavingsNeeded(state.expenses);
    
    // Create a map of all expenses by month
    const expensesByMonth = {};
    
    state.expenses
      .filter(expense => expense.recurrence === 'Annual' || expense.recurrence === 'Irregular')
      .forEach(expense => {
        const today = new Date();
        for (let month = 0; month < monthsToProject; month++) {
          const date = new Date(today.getFullYear(), today.getMonth() + month, 1);
          const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
          
          if (!expensesByMonth[monthKey]) {
            expensesByMonth[monthKey] = [];
          }

          // Handle different recurrence types
          switch (expense.recurrence) {
            case 'Annual':
              if (date.getMonth() === new Date(expense.nextDueDate).getMonth()) {
                expensesByMonth[monthKey].push({
                  amount: expense.amount,
                  description: expense.description
                });
              }
              break;
            case 'Irregular':
              if (expense.paymentSchedule) {
                const scheduleDates = expense.paymentSchedule.split(';')
                  .map(dateStr => {
                    const [day, month] = dateStr.trim().split('.');
                    return new Date(date.getFullYear(), parseInt(month) - 1, parseInt(day));
                  });
                
                if (scheduleDates.some(scheduleDate => 
                  scheduleDate.getMonth() === date.getMonth() && 
                  scheduleDate.getFullYear() === date.getFullYear()
                )) {
                  expensesByMonth[monthKey].push({
                    amount: expense.amount / scheduleDates.length,
                    description: expense.description
                  });
                }
              }
              break;
          }
        }
      });

    // Generate projection points
    Object.keys(expensesByMonth).sort().forEach(monthKey => {
      // Add monthly savings
      currentBalance += monthlySavingsNeeded;
      
      projectedPoints.push({
        date: monthKey,
        amount: currentBalance,
        type: 'savings'
      });

      // Subtract expenses for this month
      expensesByMonth[monthKey].forEach(expense => {
        currentBalance -= expense.amount;
        projectedPoints.push({
          date: monthKey,
          amount: currentBalance,
          type: 'expense',
          expenseName: expense.description
        });
      });
    });
    
    return projectedPoints;
  };

  useEffect(() => {
    const monthlySavings = calculateMonthlySavingsNeeded(state.expenses);
    setTotalSavingsNeeded(monthlySavings);
    
    const projectedPoints = calculateProjectedSavings();
    dispatch({
      type: 'UPDATE_PROJECTED_SAVINGS',
      payload: projectedPoints
    });
  }, [state.expenses, state.savings.currentAmount]);

  const handleSavingsUpdate = (amount) => {
    dispatch({
      type: 'UPDATE_SAVINGS',
      payload: {
        currentAmount: parseFloat(amount) || 0,
        date: new Date().toISOString().split('T')[0],
      },
    });
  };

  const handleAddExpense = () => {
    if (!validateExpense(newExpense)) return;

    const expense = {
      ...newExpense,
      id: Date.now().toString(),
      amount: parseFloat(newExpense.amount),
      monthlyEquivalent: calculateMonthlyEquivalent(newExpense),
      nextDueDate: getNextDueDate(newExpense),
      notes: generateNotes(newExpense),
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
    });
    setOpenDialog(false);
  };

  const handleEditExpense = (expense) => {
    if (!validateExpense(expense)) return;

    const updatedExpense = {
      ...expense,
      amount: parseFloat(expense.amount),
      monthlyEquivalent: calculateMonthlyEquivalent(expense),
      nextDueDate: getNextDueDate(expense),
      notes: generateNotes(expense),
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
        const headers = rows[0].split(',').map(header => header.trim());
        
        const newExpenses = rows.slice(1)
          .filter(row => row.trim()) // Skip empty rows
          .map(row => {
            const values = row.split(',').map(value => value.trim());
            const expense = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              category: values[headers.indexOf('Category')] || '',
              subcategory: values[headers.indexOf('Subcategory')] || '',
              description: values[headers.indexOf('Description')] || '',
              amount: parseFloat(values[headers.indexOf('Amount')]) || 0,
              recurrence: values[headers.indexOf('Recurrence')] || '',
              paymentSchedule: values[headers.indexOf('Payment Schedule')] || '',
              endDate: values[headers.indexOf('End Date')] || '2030-12-31'
            };
            
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
      'Category', 'Subcategory', 'Description', 'Amount', 'Recurrence', 'Payment Schedule', 'End Date'
    ];
    const rows = state.expenses.map(exp => [
      exp.category,
      exp.subcategory,
      exp.description,
      exp.amount,
      exp.recurrence,
      exp.paymentSchedule,
      exp.endDate
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val ?? ''}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'expenses_export.csv');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Monthly Savings Needed at the top */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Monthly Savings Needed: {totalSavingsNeeded.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}
      </Typography>
      <Grid container spacing={3}>
        {/* Current Savings Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="Current Savings"
              type="number"
              value={state.savings.currentAmount}
              onChange={(e) => handleSavingsUpdate(e.target.value)}
              sx={{ width: 200 }}
            />
          </Paper>
        </Grid>

        {/* Chart Section - now full width */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <SavingsChart 
              monthlyCalculation={monthlyCalculation}
            />
          </Paper>
        </Grid>

        {/* Collapsible Monthly Calculation Table */}
        {monthlyCalculation.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" gutterBottom>Monthly Calculation Details</Typography>
                <IconButton onClick={() => setShowMonthlyDetails(v => !v)}>
                  {showMonthlyDetails ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </div>
              {showMonthlyDetails && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell>Start Balance</TableCell>
                      <TableCell>Monthly Saving</TableCell>
                      <TableCell>Expenses</TableCell>
                      <TableCell>Total Expenses</TableCell>
                      <TableCell>End Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlyCalculation.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell>{row.startBalance.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</TableCell>
                        <TableCell>{row.monthlySaving.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</TableCell>
                        <TableCell>{row.expenses.join(', ')}</TableCell>
                        <TableCell>{row.totalExpenses.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</TableCell>
                        <TableCell>{row.endBalance.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Grid>
        )}

        {/* Expenses Table Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <Typography variant="h6">Expenses</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                 
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
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current.click()}
                  >
                    Import CSV
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleExportCSV}
                    sx={{ ml: 1 }}
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
            <TableContainer>
              <Table>
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
                    <TableCell>End Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.expenses.map((expense) => (
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
                      <TableCell>{expense.endDate}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => {
                            setEditingExpense(expense);
                            setNewExpense(expense);
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
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Expense Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
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
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
              </FormControl>
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
            {(newExpense.recurrence === 'Irregular' || newExpense.recurrence === 'One-off') && (
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={newExpense.endDate}
                onChange={(e) => setNewExpense({ ...newExpense, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
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
    </Container>
  );
};

export default SavingsPlanner; 