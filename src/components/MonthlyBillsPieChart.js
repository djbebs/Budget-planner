import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const formatCHF = (value) => {
  return `CHF ${value.toLocaleString('de-CH', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// Set of colors to use for the pie chart categories
const CHART_COLORS = [
  '#9c27b0', // Purple (matching the monthly bills in the bar chart)
  '#ff9800', // Orange
  '#4caf50', // Green
  '#2196f3', // Blue
  '#f44336', // Red
  '#ffeb3b', // Yellow
  '#00bcd4', // Cyan
  '#795548', // Brown
  '#607d8b', // Blue Grey
  '#e91e63', // Pink
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
];

const calculateMonthlyEquivalent = (expense) => {
  const amount = parseFloat(expense.amount);
  if (isNaN(amount)) return 0;

  switch (expense.recurrence) {
    case 'Annual':
      return amount / 12;
    case 'Irregular':
      if (expense.paymentSchedule) {
        const dates = expense.paymentSchedule.split(';').filter(d => d);
        return dates.length > 0 ? amount / 12 : 0; // Distribute over a year
      }
      return amount / 12;
    case 'Monthly':
      return amount;
    default:
      return 0;
  }
};

const MonthlyBillsPieChart = ({ expenses }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));
  
  // Dynamically set font sizes based on screen size
  const legendFontSize = isSmallScreen ? 18 : isMediumScreen ? 22 : 26;
  const tooltipBodyFontSize = isSmallScreen ? 16 : isMediumScreen ? 20 : 24;
  const tooltipTitleFontSize = isSmallScreen ? 18 : isMediumScreen ? 22 : 26;
  const legendPadding = isSmallScreen ? 25 : isMediumScreen ? 30 : 35;

  if (!expenses || expenses.length === 0) {
    return <Typography>No expenses data available</Typography>;
  }
  
  // Filter expenses with either monthly or equivalent monthly value
  const relevantExpenses = expenses.filter(exp => 
    exp.recurrence === 'Monthly' || 
    exp.recurrence === 'Annual' || 
    exp.recurrence === 'Irregular'
  );
  
  if (relevantExpenses.length === 0) {
    return <Typography>No expenses data available</Typography>;
  }

  // Group expenses by category and calculate totals using monthly equivalents
  const categoryTotals = relevantExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Uncategorized';
    const monthlyAmount = calculateMonthlyEquivalent(expense);
    
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += monthlyAmount;
    return acc;
  }, {});

  // Convert to chart.js format
  const categories = Object.keys(categoryTotals);
  const data = {
    labels: categories,
    datasets: [
      {
        label: 'Monthly Bills',
        data: categories.map(category => categoryTotals[category]),
        backgroundColor: categories.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
        borderColor: 'white',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isLargeScreen ? 'right' : 'bottom',
        labels: {
          font: {
            size: legendFontSize,
            weight: 'bold'
          },
          padding: legendPadding
        }
      },
      title: {
        display: false,
        text: 'Total Monthly Spending by Category',
        font: {
          size: 20,
          weight: 'bold'
        }
      },
      tooltip: {
        bodyFont: {
          size: tooltipBodyFontSize
        },
        titleFont: {
          size: tooltipTitleFontSize,
          weight: 'bold'
        },
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${context.label}: ${formatCHF(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Box sx={{ height: { xs: 400, sm: 450, md: 500 }, width: '100%', mt: 2, mb: 2 }}>
      <div style={{ width: '100%', height: '100%' }}>
        <Pie data={data} options={options} />
      </div>
    </Box>
  );
};

export default MonthlyBillsPieChart; 