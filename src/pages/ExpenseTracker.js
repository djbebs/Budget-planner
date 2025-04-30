import React, { useState } from 'react';
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
  MenuItem,
  Grid,
} from '@mui/material';
import { useFinancial } from '../context/FinancialContext';

function ExpenseTracker() {
  const { state, dispatch } = useFinancial();
  const [expense, setExpense] = useState({
    category: '',
    subcategory: '',
    description: '',
    amount: '',
    recurrence: 'Monthly',
    paymentSchedule: '',
    nextDueDate: '',
    notes: '',
    endDate: '',
  });

  const categories = [
    'Tax',
    'Mortgage',
    'Insurance',
    'Cars',
    'Education',
    'Utility bills',
    'Food',
    'Transportation',
    'Entertainment',
    'Health',
    'Clothing',
    'Miscellaneous',
  ];

  const recurrenceOptions = ['Monthly', 'Annual', 'One-time', 'Irregular'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExpense((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: parseFloat(expense.amount),
    };
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    setExpense({
      category: '',
      subcategory: '',
      description: '',
      amount: '',
      recurrence: 'Monthly',
      paymentSchedule: '',
      nextDueDate: '',
      notes: '',
      endDate: '',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Expense Tracker
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Category"
                name="category"
                value={expense.category}
                onChange={handleChange}
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subcategory"
                name="subcategory"
                value={expense.subcategory}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={expense.description}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={expense.amount}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Recurrence"
                name="recurrence"
                value={expense.recurrence}
                onChange={handleChange}
                required
              >
                {recurrenceOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Schedule"
                name="paymentSchedule"
                value={expense.paymentSchedule}
                onChange={handleChange}
                placeholder="DD.MM;DD.MM;DD.MM"
                helperText="For irregular payments, enter dates separated by semicolons"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Next Due Date"
                name="nextDueDate"
                type="date"
                value={expense.nextDueDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={expense.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={expense.notes}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Add Expense
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Subcategory</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Recurrence</TableCell>
              <TableCell>Payment Schedule</TableCell>
              <TableCell>Next Due Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.expenses.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.subcategory}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.amount.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'CHF',
                })}</TableCell>
                <TableCell>{item.recurrence}</TableCell>
                <TableCell>{item.paymentSchedule}</TableCell>
                <TableCell>{item.nextDueDate}</TableCell>
                <TableCell>{item.endDate}</TableCell>
                <TableCell>{item.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default ExpenseTracker; 