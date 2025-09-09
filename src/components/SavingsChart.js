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





const SavingsChart = ({ monthlyCalculation }) => {
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

  // Add state for the time span selection
  const [timeSpan, setTimeSpan] = useState(5); // Default to 5 years
  const [filteredData, setFilteredData] = useState([]);
  const [showMonthlySavings] = useState(false); // Set default to false to hide monthly savings

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      // Store the chart instance in a variable to avoid the React Hook warning
      const chart = chartRef.current;
      if (chart) {
        chart.destroy();
      }
    };
  }, []);

  // Filter data based on selected time span and process the data
  useEffect(() => {
    if (!monthlyCalculation || monthlyCalculation.length === 0) {
      setFilteredData([]);
      return;
    }

    // Use the first data point as the start date
    const firstItem = monthlyCalculation[0];
    if (!firstItem || !firstItem.month) {
      setFilteredData([]);
      return;
    }

    const dateParts = firstItem.month.split(' ');
    const startMonthIdx = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(dateParts[0]);
    const startYear = parseInt(dateParts[1]);
    const startDate = new Date(startYear, startMonthIdx, 1);
    const maxDate = new Date(startYear + timeSpan, startMonthIdx, 1);

    const filtered = monthlyCalculation.filter(item => {
      if (!item || !item.month) return false;
      
      // Parse the date from the month string (format: "Jan 2025")
      const dateParts = item.month.split(' ');
      const monthIdx = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(dateParts[0]);
      const year = parseInt(dateParts[1]);
      const itemDate = new Date(year, monthIdx, 1);
      return itemDate >= startDate && itemDate < maxDate;
    });

    setFilteredData(filtered);
  }, [monthlyCalculation, timeSpan]);

  if (!monthlyCalculation || monthlyCalculation.length === 0) {
    return (
      <div style={{ fontSize: '1.6rem', padding: '20px', textAlign: 'center' }}>
        {parseFloat(localStorage.getItem('currentSavings') || '0') === 0 ? 
          'No projection available with a starting balance of 0' : 
          'No data available'}
      </div>
    );
  }

  // Use filtered data for chart
  const labels = filteredData.map(row => row?.month || '');
  const dataPoints = filteredData.map(row => row?.endBalance || 0);
  const monthlySavingsPoints = filteredData.map(row => row?.monthlySaving || 0);

  // Helper function to get point color based on data
  const getPointColor = (idx) => {
    if (idx >= filteredData.length || !filteredData[idx]) return '#ff9800'; // Default orange
    
    const row = filteredData[idx];
    
    // Purple for adjustment points (start of adjustment cycles towards target balance)
    if (row.isAdjustingToInitial === true) {
      console.log(`Point ${idx} (${row.month}): Purple - Adjustment to initial balance`);
      return '#673ab7';
    }
    
    // Red for months with one-off expenses
    if (row.hasSignificantExpense === true) {
      console.log(`Point ${idx} (${row.month}): Red - One-off expense`);
      return '#f44336';
    }
    
    // Orange for months with regular expenses (annual/irregular)
    if (row.hasRegularExpense === true) {
      console.log(`Point ${idx} (${row.month}): Orange - Regular expense`);
      return '#ff9800';
    }
    
    // Blue for months with reduced savings to gradually reach target (adjustment cycles)
    if (row.isInAdjustmentCycle && row.isReducedSavings && !row.isAdjustingToInitial && !row.hasSignificantExpense) {
      console.log(`Point ${idx} (${row.month}): Blue - Adjustment cycle with reduced savings`);
      return '#2196f3';
    }
    
    // Debug: Log all the flags for adjustment cycle months
    if (row.isInAdjustmentCycle) {
      console.log(`Point ${idx} (${row.month}): Adjustment cycle flags:`, {
        isInAdjustmentCycle: row.isInAdjustmentCycle,
        isReducedSavings: row.isReducedSavings,
        isAdjustingToInitial: row.isAdjustingToInitial,
        hasSignificantExpense: row.hasSignificantExpense,
        monthlySaving: row.monthlySaving
      });
    }
    
    // Alternative blue detection: significant savings reduction
    if (idx > 0 && filteredData[idx - 1]) {
      const prevRow = filteredData[idx - 1];
      const savingsReduced = (row.monthlySaving || 0) < (prevRow.monthlySaving || 0);
      const significantReduction = Math.abs((row.monthlySaving || 0) - (prevRow.monthlySaving || 0)) > 50; // More than 50 CHF reduction
      
      if (savingsReduced && significantReduction && !row.isAdjustingToInitial && !row.hasSignificantExpense) {
        console.log(`Point ${idx} (${row.month}): Blue - Reduced savings (${(prevRow.monthlySaving || 0).toFixed(2)} -> ${(row.monthlySaving || 0).toFixed(2)})`);
        return '#2196f3';
      }
    }
    
    // Default orange
    return '#ff9800';
  };

  // Helper function to get point radius based on data
  const getPointRadius = (idx) => {
    if (idx >= filteredData.length || !filteredData[idx]) return 6; // Default radius
    
    const row = filteredData[idx];
    
    // Larger radius for special points
    if (row.isAdjustingToInitial === true) {
      return 12; // Purple adjustment points
    }
    
    if (row.hasSignificantExpense === true) {
      return 10; // Red one-off expense points
    }
    
    if (row.hasRegularExpense === true) {
      return 8; // Orange regular expense points
    }
    
    if (idx > 0 && filteredData[idx - 1]) {
      const prevRow = filteredData[idx - 1];
      const savingsReduced = (row.monthlySaving || 0) < (prevRow.monthlySaving || 0);
      const significantReduction = Math.abs((row.monthlySaving || 0) - (prevRow.monthlySaving || 0)) > 50;
      
      if (savingsReduced && significantReduction && !row.isAdjustingToInitial && !row.hasSignificantExpense) {
        return 8; // Blue reduced savings points
      }
    }
    
    return 6; // Default radius
  };

  // Log data for debugging
  console.log("Filtered data for chart:", filteredData.map((row, idx) => ({ 
    index: idx,
    month: row?.month || 'N/A', 
    isAdjusting: row?.isAdjustingToInitial || false,
    hasSignificantExpense: row?.hasSignificantExpense || false,
    monthlySaving: row?.monthlySaving || 0,
    endBalance: row?.endBalance || 0,
    expenses: row?.expenses || [],
    totalExpenses: row?.totalExpenses || 0,
    color: getPointColor(idx)
  })));

  // Additional debugging for color detection
  console.log("Color analysis:");
  filteredData.forEach((row, idx) => {
    if (!row) return;
    const color = getPointColor(idx);
    if (color !== '#ff9800') {
      console.log(`Month ${row.month} (index ${idx}): Color ${color}`, {
        isAdjustingToInitial: row.isAdjustingToInitial,
        hasSignificantExpense: row.hasSignificantExpense,
        monthlySaving: row.monthlySaving,
        prevMonthlySaving: idx > 0 && filteredData[idx-1] ? filteredData[idx-1].monthlySaving : 'N/A'
      });
    }
  });

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
                  text: '● Orange points indicate months with regular expenses (annual/irregular)',
                  fillStyle: '#ff9800',
                  strokeStyle: '#ff9800',
                  lineWidth: 0,
                  pointStyle: 'circle',
                  fontColor: '#ff9800'
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
              const row = filteredData[idx];
              
              if (!row) return [];
              
              // Create formatted labels in table format with colored text
              let labels = [];
              
              // Add separator line for better structure
              labels.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              
              // Start balance
              labels.push(`📊 Start Balance: ${formatCHF(row.startBalance || 0)}`);
              
              // Monthly saving with green color indicator
              if (row.isAdjustingToInitial) {
                labels.push(`🟣 Adjustment: Recalculating savings after one-off payment`);
                labels.push(`🟢 Monthly Saving: ${formatCHF(row.monthlySaving || 0)}`);
              } else if (idx > 0 && filteredData[idx - 1]) {
                const prevRow = filteredData[idx - 1];
                const savingChanged = Math.abs((row.monthlySaving || 0) - (prevRow.monthlySaving || 0)) > 0.01;
                
                if (savingChanged) {
                  const diff = (row.monthlySaving || 0) - (prevRow.monthlySaving || 0);
                  const direction = diff > 0 ? '↑' : '↓';
                  const color = diff < 0 ? '🔵' : '🟢';
                  labels.push(`${color} Monthly Saving: ${formatCHF(row.monthlySaving || 0)} ${direction} (${formatCHF(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'})`);
                } else {
                  labels.push(`🟢 Monthly Saving: ${formatCHF(row.monthlySaving || 0)}`);
                }
              } else {
                labels.push(`🟢 Monthly Saving: ${formatCHF(row.monthlySaving || 0)}`);
              }
              
              // Add separator
              labels.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              
              // Expenses - highlight based on type
              if (row.expenses && row.expenses.length > 0) {
                let expenseText;
                if (row.hasSignificantExpense) {
                  expenseText = `🔴 One-off Expenses: ${row.expenses.join(', ')}`;
                } else if (row.hasRegularExpense) {
                  expenseText = `🟡 Regular Expenses: ${row.expenses.join(', ')}`;
                } else {
                  expenseText = `📋 Expenses: ${row.expenses.join(', ')}`;
                }
                labels.push(expenseText);
              } else if (!row.isAdjustingToInitial) {
                labels.push('📋 Expenses: None');
              }
              
              // Total expenses with color indicator based on type
              if (row.totalExpenses && row.totalExpenses > 0) {
                if (row.hasSignificantExpense) {
                  labels.push(`🔴 Total Expenses: ${formatCHF(row.totalExpenses)} (contains one-off payment)`);
                } else if (row.hasRegularExpense) {
                  labels.push(`🟡 Total Expenses: ${formatCHF(row.totalExpenses)} (contains regular payment)`);
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
      },
      y1: {
        display: showMonthlySavings,
        position: 'right',
        title: {
          display: true,
          text: 'Monthly Savings (CHF)',
          font: {
            size: axisLabelFontSize * 0.8,
            weight: 'bold'
          },
          padding: { left: 15, right: 15 }
        },
        grid: {
          display: false,
        },
        ticks: {
          callback: function(value) {
            return formatCHF(value);
          },
          font: {
            size: tickFontSize * 0.8
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
      },
      ...(showMonthlySavings ? [{
        label: 'Monthly Savings',
        data: monthlySavingsPoints,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: false,
        pointBackgroundColor: (ctx) => {
          try {
            const idx = ctx.dataIndex;
            // Change point color for months when savings amount changes
            if (idx > 0 && idx < filteredData.length && filteredData[idx] && filteredData[idx - 1]) {
              const row = filteredData[idx];
              const prevRow = filteredData[idx - 1];
              const savingChanged = Math.abs((row.monthlySaving || 0) - (prevRow.monthlySaving || 0)) > 0.01;
              if (savingChanged) {
                return '#2196f3'; // Blue for months when savings change
              }
            }
            return '#4caf50'; // Default green
          } catch (error) {
            console.error('Error getting monthly savings point color:', error);
            return '#4caf50';
          }
        },
        pointBorderColor: '#fff',
        pointStyle: 'rectRot',
        borderDash: [5, 5],
        yAxisID: 'y1'
      }] : [])
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
          key={`chart-${timeSpan}-${filteredData.length}`} // Force re-render when data changes
        />
      </div>
    </div>
  );
};

export default SavingsChart; 