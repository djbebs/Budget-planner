import React, { useMemo } from 'react';
import {
  Paper,
  Typography,
  Grid,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const FinancialDashboard = ({ income, expenses }) => {
  const monthlyData = useMemo(() => {
    const data = [];
    const currentYear = new Date().getFullYear();
    
    // Initialize monthly data structure
    for (let month = 0; month < 12; month++) {
      data.push({
        month: new Date(currentYear, month).toLocaleString('default', { month: 'short' }),
        regularIncome: 0,
        oneOffIncome: 0,
        expenses: 0,
        remainingBudget: 0,
      });
    }

    // Process regular income (salary and 13th month)
    income.forEach(inc => {
      const amount = parseFloat(inc.amount) || 0;
      
      if (inc.frequency === 'Monthly') {
        // Add monthly salary to all months
        data.forEach(month => {
          month.regularIncome += amount;
        });
      } else if (inc.source === '13th month' && inc.frequency === '1 off') {
        // Add 13th month salary to December
        data[11].regularIncome += amount;
      }
    });

    // Process one-off income
    income.forEach(inc => {
      if (inc.frequency === '1 off' && inc.source !== '13th month' && inc.startDate) {
        const amount = parseFloat(inc.amount) || 0;
        const date = new Date(inc.startDate.split('.').reverse().join('-'));
        const month = date.getMonth();
        data[month].oneOffIncome += amount;
      }
    });

    // Process monthly expenses
    expenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      
      if (exp.recurrence === 'Monthly') {
        // Add to all months
        data.forEach(month => {
          month.expenses += amount;
        });
      } else if (exp.recurrence === 'Annual') {
        // Add to specific month if nextDueDate exists
        if (exp.nextDueDate) {
          const dueDate = new Date(exp.nextDueDate);
          const month = dueDate.getMonth();
          data[month].expenses += amount;
        }
      } else if (exp.recurrence === 'Irregular' || exp.recurrence === 'One-off') {
        // Add to specific months based on payment schedule
        if (exp.paymentSchedule) {
          const dates = exp.paymentSchedule.split(';');
          dates.forEach(dateStr => {
            const [day, month] = dateStr.trim().split('.');
            if (month) {
              data[parseInt(month) - 1].expenses += amount / dates.length;
            }
          });
        }
      }
    });

    // Calculate remaining budget
    data.forEach(month => {
      month.remainingBudget = month.regularIncome - month.expenses;
    });

    return data;
  }, [income, expenses]);

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Monthly Financial Overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={monthlyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => value.toLocaleString('de-CH', {
                  style: 'currency',
                  currency: 'CHF'
                })}
              />
              <Legend />
              <Bar dataKey="regularIncome" name="Regular Income" fill="#4caf50" />
              <Bar dataKey="oneOffIncome" name="One-off Income" fill="#2196f3" />
              <Bar dataKey="expenses" name="Expenses" fill="#f44336" />
              <Bar dataKey="remainingBudget" name="Remaining Budget" fill="#ffeb3b" />
            </BarChart>
          </ResponsiveContainer>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            * Regular Income includes monthly salary and 13th month payment
            * One-off Income includes bonuses and other non-regular payments
            * Remaining Budget is calculated based on regular income only
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FinancialDashboard; 