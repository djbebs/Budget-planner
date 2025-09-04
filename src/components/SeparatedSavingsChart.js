import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const formatCHF = (value) => {
  return `CHF ${value.toLocaleString('de-CH', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

const SeparatedSavingsChart = ({ 
  regularSavingsNeeded, 
  oneOffTimeline, 
  currentAmount, 
  targetAmount 
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const chartRef = useRef(null);

  // Dynamically set font sizes based on screen size
  const axisLabelFontSize = isSmallScreen ? 24 : isMediumScreen ? 28 : 32;
  const tickFontSize = isSmallScreen ? 20 : isMediumScreen ? 24 : 28;
  const tooltipBodyFontSize = isSmallScreen ? 20 : isMediumScreen ? 24 : 28;
  const tooltipTitleFontSize = isSmallScreen ? 22 : isMediumScreen ? 26 : 30;
  const legendFontSize = isSmallScreen ? 20 : isMediumScreen ? 24 : 28;

  const [timeSpan, setTimeSpan] = useState(5);
  const [projectedData, setProjectedData] = useState([]);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Generate projection data
  useEffect(() => {
    if (!regularSavingsNeeded && !oneOffTimeline.length) {
      setProjectedData([]);
      return;
    }

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endDate = new Date(startDate.getFullYear() + timeSpan, startDate.getMonth(), 1);
    
    const months = [];
    const currentDate = new Date(startDate);
    let balance = parseFloat(currentAmount) || 0;
    const target = parseFloat(targetAmount) || 0;
    
    // Track which one-off payments have been made
    const remainingOneOffs = [...oneOffTimeline];
    
    while (currentDate < endDate) {
      const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      const monthKey = currentDate.toISOString().slice(0, 7);
      
      // Calculate current monthly savings (regular + remaining one-off contributions)
      const currentOneOffContribution = remainingOneOffs.reduce((sum, oneOff) => {
        return sum + oneOff.monthlyContribution;
      }, 0);
      
      const currentMonthlySavings = regularSavingsNeeded + currentOneOffContribution;
      
      // Check for one-off payments this month
      const paymentsThisMonth = remainingOneOffs.filter(oneOff => {
        const oneOffDate = new Date(oneOff.paymentDate);
        return oneOffDate.getFullYear() === currentDate.getFullYear() && 
               oneOffDate.getMonth() === currentDate.getMonth();
      });
      
      const totalExpensesThisMonth = paymentsThisMonth.reduce((sum, payment) => sum + payment.expenseAmount, 0);
      const expenseDescriptions = paymentsThisMonth.map(p => p.description);
      
      // Calculate balances
      const startBalance = balance;
      balance += currentMonthlySavings;
      balance -= totalExpensesThisMonth;
      
      // Remove paid one-offs from future calculations
      if (paymentsThisMonth.length > 0) {
        remainingOneOffs.splice(0, remainingOneOffs.length, 
          ...remainingOneOffs.filter(oneOff => {
            const oneOffDate = new Date(oneOff.paymentDate);
            return !(oneOffDate.getFullYear() === currentDate.getFullYear() && 
                    oneOffDate.getMonth() === currentDate.getMonth());
          })
        );
      }
      
      // Emergency protection: ensure we never go below target
      let adjustedSavings = currentMonthlySavings;
      if (balance < target) {
        const deficit = target - balance + 100; // Small safety margin
        adjustedSavings = currentMonthlySavings + deficit;
        balance = startBalance + adjustedSavings - totalExpensesThisMonth;
      }
      
      const isOneOffPaymentMonth = paymentsThisMonth.length > 0;
      const isAdjustmentMonth = months.length > 0 && months[months.length - 1]?.hasSignificantExpense;
      
      months.push({
        month: monthName,
        date: monthName,
        monthKey,
        startBalance: startBalance,
        monthlySaving: adjustedSavings,
        regularSaving: regularSavingsNeeded,
        oneOffContribution: currentOneOffContribution,
        expenses: expenseDescriptions,
        totalExpenses: totalExpensesThisMonth,
        endBalance: balance,
        remainingOneOffs: remainingOneOffs.length,
        isAdjustingToInitial: isAdjustmentMonth,
        hasSignificantExpense: isOneOffPaymentMonth,
        belowTargetBalance: balance < target,
        monthIndex: months.length
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      // Stop if balance goes negative (should not happen with proper calculation)
      if (balance < 0) {
        break;
      }
    }
    
    setProjectedData(months);
  }, [regularSavingsNeeded, oneOffTimeline, currentAmount, targetAmount, timeSpan]);

  if (!regularSavingsNeeded && !oneOffTimeline.length) {
    return (
      <div style={{ fontSize: '1.6rem', padding: '20px', textAlign: 'center' }}>
        No projection available. Add some expenses to see the projection.
      </div>
    );
  }

  // Use projected data for chart
  const labels = projectedData.map(row => row?.month || '');
  const dataPoints = projectedData.map(row => row?.endBalance || 0);
  const regularSavingsPoints = projectedData.map(row => row?.regularSaving || 0);
  const oneOffSavingsPoints = projectedData.map(row => row?.oneOffContribution || 0);

  // Helper function to get point color based on data
  const getPointColor = (idx) => {
    if (idx >= projectedData.length || !projectedData[idx]) return '#ff9800'; // Default orange
    
    const row = projectedData[idx];
    
    // Purple for adjustment points (start of adjustment cycles towards target balance)
    if (row.isAdjustingToInitial === true) {
      return '#673ab7';
    }
    
    // Red for months with one-off expenses
    if (row.hasSignificantExpense === true) {
      return '#f44336';
    }
    
    // Default orange
    return '#ff9800';
  };

  // Helper function to get point radius based on data
  const getPointRadius = (idx) => {
    if (idx >= projectedData.length || !projectedData[idx]) return 6; // Default radius
    
    const row = projectedData[idx];
    
    // Larger radius for special points
    if (row.isAdjustingToInitial === true) {
      return 12; // Purple adjustment points
    }
    
    if (row.hasSignificantExpense === true) {
      return 10; // Red one-off expense points
    }
    
    return 6; // Default radius
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: legendFontSize,
            weight: 'bold'
          },
          padding: 20,
          generateLabels: function(chart) {
            try {
              const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
              const labels = original.call(this, chart);
              
              // Add custom legend items for the color coding
              labels.push(
                {
                  text: '● Red points indicate months with one-off expenses',
                  fillStyle: '#f44336',
                  strokeStyle: '#f44336',
                  lineWidth: 0,
                  pointStyle: 'circle',
                  fontColor: '#f44336'
                },
                {
                  text: '● Purple points indicate start of adjustment cycles towards target balance',
                  fillStyle: '#673ab7',
                  strokeStyle: '#673ab7',
                  lineWidth: 0,
                  pointStyle: 'circle',
                  fontColor: '#673ab7'
                }
              );
              
              return labels;
            } catch (error) {
              console.error('Error generating legend labels:', error);
              return [];
            }
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        padding: 16,
        bodySpacing: 8,
        bodyFont: {
          size: tooltipBodyFontSize
        },
        titleFont: {
          size: tooltipTitleFontSize,
          weight: 'bold'
        },
        callbacks: {
          label: function(context) {
            try {
              const idx = context.dataIndex;
              const row = projectedData[idx];
              
              if (!row) return [];
              
              // Create formatted labels in table format with colored text
              let labels = [];
              
              // Add separator line for better structure
              labels.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              
              // Start balance
              labels.push(`📊 Start Balance: ${formatCHF(row.startBalance || 0)}`);
              
              // Regular savings
              labels.push(`🟢 Regular Savings: ${formatCHF(row.regularSaving || 0)}`);
              
              // One-off contributions
              if (row.oneOffContribution > 0) {
                labels.push(`🔵 One-off Contributions: ${formatCHF(row.oneOffContribution || 0)}`);
              }
              
              // Total monthly saving
              labels.push(`💰 Total Monthly Saving: ${formatCHF(row.monthlySaving || 0)}`);
              
              // Add separator
              labels.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              
              // Expenses - highlight if one-off
              if (row.expenses && row.expenses.length > 0) {
                const expenseText = row.hasSignificantExpense 
                  ? `🔴 One-off Expenses: ${row.expenses.join(', ')}` 
                  : `📋 Expenses: ${row.expenses.join(', ')}`;
                labels.push(expenseText);
              } else if (!row.isAdjustingToInitial) {
                labels.push('📋 Expenses: None');
              }
              
              // Total expenses with orange color indicator
              if (row.totalExpenses && row.totalExpenses > 0) {
                if (row.hasSignificantExpense) {
                  labels.push(`🟠 Total Expenses: ${formatCHF(row.totalExpenses)} (contains one-off payment)`);
                } else {
                  labels.push(`🟠 Total Expenses: ${formatCHF(row.totalExpenses)}`);
                }
              }
              
              // Add separator
              labels.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              
              // End balance
              labels.push(`💰 End Balance: ${formatCHF(row.endBalance || 0)}`);
              
              return labels;
            } catch (error) {
              console.error('Error in tooltip callback:', error);
              return ['Error displaying tooltip'];
            }
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month',
          font: {
            size: axisLabelFontSize,
            weight: 'bold'
          },
          padding: { top: 15, bottom: 15 }
        },
        grid: {
          display: true,
          drawBorder: true,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: tickFontSize
          },
          padding: 10
        }
      },
      y: {
        title: {
          display: true,
          text: 'Amount (CHF)',
          font: {
            size: axisLabelFontSize,
            weight: 'bold'
          },
          padding: { left: 15, right: 15 }
        },
        grid: {
          display: true,
          drawBorder: true,
        },
        ticks: {
          callback: function(value) {
            return formatCHF(value);
          },
          font: {
            size: tickFontSize
          },
          padding: 10
        }
      }
    },
    elements: {
      line: {
        tension: 0.1,
        borderWidth: 4,
        stepped: 'after'
      },
      point: {
        radius: (ctx) => {
          try {
            return getPointRadius(ctx.dataIndex);
          } catch (error) {
            console.error('Error getting point radius:', error);
            return 6;
          }
        },
        hitRadius: 12,
        hoverRadius: (ctx) => {
          try {
            return getPointRadius(ctx.dataIndex) + 2;
          } catch (error) {
            console.error('Error getting hover radius:', error);
            return 8;
          }
        },
        borderWidth: 3,
        backgroundColor: (ctx) => {
          try {
            return getPointColor(ctx.dataIndex);
          } catch (error) {
            console.error('Error getting point color:', error);
            return '#ff9800';
          }
        },
        borderColor: '#fff'
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const data = {
    labels,
    datasets: [
      {
        label: 'Account Balance',
        data: dataPoints,
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        fill: true,
        pointBackgroundColor: (ctx) => {
          try {
            return getPointColor(ctx.dataIndex);
          } catch (error) {
            console.error('Error getting point background color:', error);
            return '#ff9800';
          }
        },
        pointBorderColor: '#fff',
        pointRadius: (ctx) => {
          try {
            return getPointRadius(ctx.dataIndex);
          } catch (error) {
            console.error('Error getting point radius:', error);
            return 6;
          }
        },
        pointHoverRadius: (ctx) => {
          try {
            return getPointRadius(ctx.dataIndex) + 2;
          } catch (error) {
            console.error('Error getting point hover radius:', error);
            return 8;
          }
        },
        yAxisID: 'y'
      }
    ]
  };

  const handleTimeSpanChange = (event) => {
    setTimeSpan(event.target.value);
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '2rem', sm: '4rem', md: '5rem' }, fontWeight: 'bold' }}>Projection Time Span</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Years</InputLabel>
            <Select
              value={timeSpan}
              label="Years"
              onChange={handleTimeSpanChange}
              sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}
            >
              <MenuItem value={1}>Until 2026</MenuItem>
              <MenuItem value={2}>Until 2027</MenuItem>
              <MenuItem value={3}>Until 2028</MenuItem>
              <MenuItem value={4}>Until 2029</MenuItem>
              <MenuItem value={5}>Until 2030</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      <div style={{ height: '600px', width: '100%' }}>
        <Line 
          ref={chartRef}
          data={data} 
          options={options} 
          key={`chart-${timeSpan}-${projectedData.length}`} // Force re-render when data changes
        />
      </div>
    </div>
  );
};

export default SeparatedSavingsChart;
