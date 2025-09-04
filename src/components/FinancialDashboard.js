import React, { useMemo } from 'react';
import {
  Paper,
  Typography,
  Grid,
  useTheme,
  useMediaQuery
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
import { useFinancial } from '../context/FinancialContext';
import { getMonthlyCalculationDetails } from '../utils';

// Memoized tooltip component to prevent re-renders
const CustomTooltip = React.memo(({ active, payload, label, tooltipFontSize, tooltipTitleFontSize }) => {
  if (!active || !payload || payload.length === 0) return null;
  
  const data = payload[0].payload;
  const availableCash = (data.regularIncome + data.oneOffIncome) - (data.monthlyBills + data.monthlySavings);
  
  return (
    <div style={{ 
      background: '#fff', 
      border: '1px solid #ccc', 
      padding: '16px', 
      fontSize: tooltipFontSize,
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      borderRadius: '4px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: tooltipTitleFontSize, borderBottom: '1px solid #eee', paddingBottom: '8px' }}>{label}</div>
      <div style={{ color: '#4caf50', padding: '4px 0' }}>Regular Income : {data.regularIncome.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</div>
      <div style={{ color: '#2196f3', padding: '4px 0' }}>One-off Income : {data.oneOffIncome.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</div>
      <div style={{ color: '#9c27b0', padding: '4px 0' }}>Monthly Bills : {data.monthlyBills.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</div>
      <div style={{ color: '#ff9800', padding: '4px 0' }}>Total Monthly Savings : {data.monthlySavings.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</div>
      {data.baselineSaving !== undefined && data.oneOffContribution !== undefined && (
        <>
          <div style={{ color: '#ff6600', padding: '2px 0 2px 20px', fontSize: '0.9em' }}>• Baseline (Recurring) : {data.baselineSaving.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</div>
          <div style={{ color: '#ff6600', padding: '2px 0 2px 20px', fontSize: '0.9em' }}>• One-off Contributions : {data.oneOffContribution.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</div>
        </>
      )}
      <div style={{ color: '#000', fontWeight: 'bold', marginTop: 12, paddingTop: 10, borderTop: '1px solid #eee', fontSize: tooltipTitleFontSize }}>Available cash : {availableCash.toLocaleString('de-CH', { style: 'currency', currency: 'CHF' })}</div>
    </div>
  );
});

const FinancialDashboard = React.memo(({ income, expenses }) => {
  const { state } = useFinancial();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Responsive sizes - memoized to prevent recalculation
  const responsiveSizes = useMemo(() => ({
    chartHeight: isSmallScreen ? 500 : isMediumScreen ? 550 : 600,
    tickFontSize: isSmallScreen ? 14 : isMediumScreen ? 16 : 18,
    tooltipFontSize: isSmallScreen ? '1.3rem' : isMediumScreen ? '1.5rem' : '1.8rem',
    tooltipTitleFontSize: isSmallScreen ? '1.4rem' : isMediumScreen ? '1.6rem' : '2rem',
    legendFontSize: isSmallScreen ? '1.3rem' : isMediumScreen ? '1.5rem' : '1.8rem',
  }), [isSmallScreen, isMediumScreen]);
  
  const monthlyData = useMemo(() => {
    const data = [];
    const currentYear = new Date().getFullYear();
    
    // Get the monthly calculation details which contain the savings amounts for each month
    const monthlyCalculation = getMonthlyCalculationDetails(
      expenses, 
      state.savings.currentAmount,
      state.savings.targetAmount,
      state.savings.adjustmentCycle
    );
    
    // Map the monthly calculation details to months of the current year
    const monthlySavingsByMonth = new Array(12).fill(0);
    const baselineSavingsByMonth = new Array(12).fill(0);
    const oneOffContributionsByMonth = new Array(12).fill(0);
    
    // Extract the first 12 months (current year) of savings data
    monthlyCalculation.slice(0, 12).forEach((monthData, index) => {
      if (index < 12) {
        monthlySavingsByMonth[index] = monthData.monthlySaving || 0;
        baselineSavingsByMonth[index] = monthData.baselineSaving || 0;
        oneOffContributionsByMonth[index] = monthData.oneOffContribution || 0;
      }
    });
    
    // Initialize monthly data structure
    for (let month = 0; month < 12; month++) {
      data.push({
        month: new Date(currentYear, month).toLocaleString('default', { month: 'short' }),
        regularIncome: 0,
        oneOffIncome: 0,
        monthlyBills: 0,
        monthlySavings: monthlySavingsByMonth[month],
        baselineSaving: baselineSavingsByMonth[month],
        oneOffContribution: oneOffContributionsByMonth[month],
        totalIncome: 0,
        totalExpenses: 0,
      });
    }

    // Process regular income (salary and 13th month)
    income.forEach(inc => {
      const amount = parseFloat(inc.amount) || 0;
      
      if (inc.frequency === 'Monthly') {
        // Add monthly salary to all months
        data.forEach(month => {
          month.regularIncome += amount;
          month.totalIncome += amount;
        });
      } else if (inc.source === '13th month' && inc.frequency === '1 off') {
        // Add 13th month salary to December
        data[11].regularIncome += amount;
        data[11].totalIncome += amount;
      }
    });

    // Process one-off income
    income.forEach(inc => {
      if (inc.frequency === '1 off' && inc.source !== '13th month' && inc.startDate) {
        const amount = parseFloat(inc.amount) || 0;
        const date = new Date(inc.startDate.split('.').reverse().join('-'));
        const month = date.getMonth();
        data[month].oneOffIncome += amount;
        data[month].totalIncome += amount;
      }
    });

    // Process monthly expenses
    expenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      
      if (exp.recurrence === 'Monthly') {
        // Add to all months
        data.forEach(month => {
          month.monthlyBills += amount;
          month.totalExpenses += amount;
        });
      }
      
      // Process non-monthly expenses (Annual and Irregular) for totalExpenses only
      else if (exp.recurrence === 'Annual') {
        if (exp.nextDueDate) {
          const dueDate = new Date(exp.nextDueDate);
          const month = dueDate.getMonth();
          data[month].totalExpenses += amount;
        }
      } else if (exp.recurrence === 'Irregular' || exp.recurrence === 'One-off') {
        if (exp.paymentSchedule) {
          const dates = exp.paymentSchedule.split(';');
          dates.forEach(dateStr => {
            const [, month] = dateStr.trim().split('.');
            if (month) {
              const monthIndex = parseInt(month) - 1;
              data[monthIndex].totalExpenses += amount / dates.length;
            }
          });
        }
      }
    });

    // Add the monthly savings to total expenses
    data.forEach((month, index) => {
      month.totalExpenses += month.monthlySavings;
    });

    return data;
  }, [income, expenses, state.savings.currentAmount, state.savings.targetAmount, state.savings.adjustmentCycle]);

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, fontSize: { xs: '2rem', sm: '4rem', md: '5rem' } }}>
        Monthly Financial Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ResponsiveContainer width="100%" height={responsiveSizes.chartHeight}>
            <BarChart
              data={monthlyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: responsiveSizes.tickFontSize }} />
              <YAxis tick={{ fontSize: responsiveSizes.tickFontSize }} />
              <Tooltip 
                content={({ active, payload, label }) => (
                  <CustomTooltip 
                    active={active} 
                    payload={payload} 
                    label={label}
                    tooltipFontSize={responsiveSizes.tooltipFontSize}
                    tooltipTitleFontSize={responsiveSizes.tooltipTitleFontSize}
                  />
                )}
              />
              <Legend wrapperStyle={{ fontSize: responsiveSizes.legendFontSize, padding: '10px 0' }} />
              <Bar dataKey="regularIncome" name="Regular Income" fill="#4caf50" stackId="income" />
              <Bar dataKey="oneOffIncome" name="One-off Income" fill="#2196f3" stackId="income" />
              <Bar dataKey="monthlyBills" name="Monthly Bills" fill="#9c27b0" stackId="expenses" />
              <Bar dataKey="monthlySavings" name="Monthly Savings for irregular Bills" fill="#ff9800" stackId="expenses" />
            </BarChart>
          </ResponsiveContainer>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1" color="text.secondary" sx={{ 
            fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.7rem' }, 
            mt: 2, 
            fontWeight: 500,
            lineHeight: 1.6
          }}>
            * Regular Income includes monthly salary and 13th month payment
            * One-off Income includes bonuses and other non-regular payments
            * Monthly Bills includes only regular monthly expenses
            * Monthly Savings represents the amount needed to cover future expenses
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
});

export default FinancialDashboard; 