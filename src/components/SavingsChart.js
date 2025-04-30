import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  if (!monthlyCalculation || monthlyCalculation.length === 0) {
    return <div>No data available</div>;
  }

  // Use monthlyCalculation for chart data
  const labels = monthlyCalculation.map(row => row.month);
  const dataPoints = monthlyCalculation.map(row => row.endBalance);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Savings Account Projection',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const idx = context.dataIndex;
            const row = monthlyCalculation[idx];
            return [
              `Start Balance: ${formatCHF(row.startBalance)}`,
              `Monthly Saving: ${formatCHF(row.monthlySaving)}`,
              `Expenses: ${row.expenses.join(', ') || 'None'}`,
              `Total Expenses: ${formatCHF(row.totalExpenses)}`,
              `End Balance: ${formatCHF(row.endBalance)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month'
        },
        grid: {
          display: true,
          drawBorder: true,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        title: {
          display: true,
          text: 'Amount (CHF)'
        },
        grid: {
          display: true,
          drawBorder: true,
        },
        ticks: {
          callback: function(value) {
            return formatCHF(value);
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.1,
        borderWidth: 2,
        stepped: 'after'
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6,
        borderWidth: 2
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
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff'
      }
    ]
  };

  return (
    <div style={{ height: '400px', width: '100%', padding: '20px' }}>
      <Line options={options} data={data} />
    </div>
  );
};

export default SavingsChart; 