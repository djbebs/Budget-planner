import React, { useMemo } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import { useFinancial } from '../context/FinancialContext';

function Dashboard() {
  const { state } = useFinancial();

  const summaryData = useMemo(() => {
    const totalIncome = state.income
      .filter(income => income.frequency === 'Monthly')
      .reduce((sum, income) => sum + income.amount, 0);

    const totalExpenses = state.expenses
      .filter(expense => expense.recurrence === 'Monthly')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const monthlySavings = totalIncome - totalExpenses;

    const upcomingPayments = state.expenses
      .filter(expense => {
        if (expense.recurrence === 'Monthly') return false;
        const dueDate = new Date(expense.nextDueDate || expense.endDate);
        return dueDate > new Date();
      })
      .sort((a, b) => {
        const dateA = new Date(a.nextDueDate || a.endDate);
        const dateB = new Date(b.nextDueDate || b.endDate);
        return dateA - dateB;
      })
      .slice(0, 5)
      .map(expense => ({
        description: expense.description,
        amount: expense.amount,
        dueDate: expense.nextDueDate || expense.endDate,
      }));

    return {
      totalIncome,
      totalExpenses,
      monthlySavings,
      upcomingPayments,
    };
  }, [state.income, state.expenses]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Financial Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Monthly Income
            </Typography>
            <Typography component="p" variant="h4">
              {summaryData.totalIncome.toLocaleString('en-US', {
                style: 'currency',
                currency: 'CHF',
              })}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Monthly Expenses
            </Typography>
            <Typography component="p" variant="h4">
              {summaryData.totalExpenses.toLocaleString('en-US', {
                style: 'currency',
                currency: 'CHF',
              })}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Monthly Savings
            </Typography>
            <Typography component="p" variant="h4">
              {summaryData.monthlySavings.toLocaleString('en-US', {
                style: 'currency',
                currency: 'CHF',
              })}
            </Typography>
          </Paper>
        </Grid>

        {/* Upcoming Payments */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Upcoming Payments
            </Typography>
            <Box sx={{ mt: 2 }}>
              {summaryData.upcomingPayments.map((payment, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">{payment.description}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {payment.amount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'CHF',
                    })}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard; 