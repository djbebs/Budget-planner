import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { getMonthlyCalculationDetails, calculateMonthlySavingsNeeded } from './utils';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  annotationPlugin, 
  ChartDataLabels
);

// Dialog component for editing expenses
const EditDialog = ({ isOpen, onClose, expense, onSave }) => {
  const [editedExpense, setEditedExpense] = useState({ ...expense });
  
  useEffect(() => {
    setEditedExpense({ ...expense });
  }, [expense]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedExpense({
      ...editedExpense,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedExpense);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>Edit Expense</h3>
        <form onSubmit={handleSubmit}>
          <div className="dialog-field">
            <label>Description:</label>
            <input 
              type="text" 
              name="description" 
              value={editedExpense.description || ''} 
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="dialog-field">
            <label>Amount (CHF):</label>
            <input 
              type="number" 
              name="amount" 
              value={editedExpense.amount || ''} 
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>
          
          <div className="dialog-field">
            <label>Recurrence:</label>
            <select 
              name="recurrence" 
              value={editedExpense.recurrence || 'Annual'} 
              onChange={handleChange}
            >
              <option value="Annual">Annual</option>
              <option value="Monthly">Monthly</option>
              <option value="Irregular">Irregular</option>
              <option value="One-off">One-off</option>
            </select>
          </div>
          
          <div className="dialog-field">
            <label>Payment Schedule:</label>
            <input 
              type="text" 
              name="paymentSchedule" 
              value={editedExpense.paymentSchedule || ''} 
              onChange={handleChange}
              placeholder={
                editedExpense.recurrence === 'Annual' ? 'DD.MM' : 
                editedExpense.recurrence === 'One-off' ? 'DD.MM.YYYY' : 
                'DD.MM;DD.MM;...'
              }
            />
          </div>
          
          <div className="dialog-field">
            <label>End Date:</label>
            <input 
              type="text" 
              name="endDate" 
              value={editedExpense.endDate || ''} 
              onChange={handleChange}
              placeholder="DD/MM/YYYY"
            />
          </div>
          
          <div className="dialog-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('input'); // input, results, details
  const [data, setData] = useState([]);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [csvFile, setCsvFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState(-1);
  const [incomes, setIncomes] = useState([
    {
      description: "Salary",
      amount: "8000.00",
      frequency: "Monthly",
    },
    {
      description: "Bonus",
      amount: "5000.00",
      frequency: "Annual",
      month: "December"
    }
  ]);
  const [newIncome, setNewIncome] = useState({
    description: '',
    amount: '',
    frequency: 'Monthly',
    month: ''
  });
  const [expenses, setExpenses] = useState([
    {
      description: "Tax Installments",
      amount: "7920.00",
      recurrence: "Annual",
      paymentSchedule: "15.11"
    },
    {
      description: "AXA Legal Insurance",
      amount: "346.90",
      recurrence: "Annual",
      paymentSchedule: "15.12"
    },
    {
      description: "School Fees, Electricity, Road tax, Vignette",
      amount: "13502.00",
      recurrence: "Annual",
      paymentSchedule: "15.1"
    },
    {
      description: "AXA Household Insurance, AXA Tesla, Jeep Maintenance",
      amount: "11516.85",
      recurrence: "Annual",
      paymentSchedule: "15.3"
    },
    {
      description: "Annual TV/Radio tax, School Fees",
      amount: "19285.00",
      recurrence: "Annual",
      paymentSchedule: "15.5"
    },
    {
      description: "Jeep Insurance",
      amount: "9135.30",
      recurrence: "Annual",
      paymentSchedule: "15.7"
    },
    {
      description: "Driveway",
      amount: "29920.00",
      recurrence: "One-off",
      paymentSchedule: "15.9.2026"
    }
  ]);
  const [currentAmount, setCurrentAmount] = useState(20000);
  const [targetAmount, setTargetAmount] = useState(15000);
  const [adjustmentCycle, setAdjustmentCycle] = useState(1);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    recurrence: 'Annual',
    paymentSchedule: ''
  });

  useEffect(() => {
    try {
      // Wrap in a small timeout to prevent excessive calculations during rapid input changes
      const handler = setTimeout(() => {
        // Calculate monthly savings amount
        const savings = calculateMonthlySavingsNeeded(expenses, currentAmount, targetAmount, adjustmentCycle);
        setMonthlySavings(savings);
        
        // Generate detailed monthly calculations
        const monthlyDetails = getMonthlyCalculationDetails(expenses, currentAmount, targetAmount, adjustmentCycle);
        
        // Ensure expenses are always arrays for consistency in rendering
        const processedData = monthlyDetails.map(item => {
          return {
            ...item,
            expenses: Array.isArray(item.expenses) ? item.expenses : 
                    (item.expenses ? [item.expenses] : [])
          };
        });
        
        setData(processedData);
      }, 300); // Small debounce to improve performance
      
      // Cleanup function
      return () => clearTimeout(handler);
    } catch (error) {
      console.error("Error calculating monthly details:", error);
    }
  }, [expenses, currentAmount, targetAmount, adjustmentCycle, incomes]);

  function formatCurrency(amount) {
    return `CHF ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function getRowClass(item) {
    // Determine if this is a month with one-off or regular expenses
    const hasOneOff = item.expenses && item.expenses.some(exp => 
      exp.toLowerCase().includes('driveway'));
    const hasRegular = item.expenses && item.expenses.length > 0 && !hasOneOff;
    
    // Check if monthly saving amount changed
    const isSavingsChange = item.monthIndex > 0 && 
      data[item.monthIndex - 1] && 
      data[item.monthIndex - 1].monthlySaving !== item.monthlySaving;
    
    // Apply appropriate class
    if (hasOneOff) return 'one-off-expense';
    if (hasRegular) return 'regular-expense';
    if (isSavingsChange) return 'savings-adjustment';
    return '';
  }

  function getExpenseIcon(item) {
    // Check expense type by description
    if (item.expenses && item.expenses.some(exp => exp.toLowerCase().includes('driveway'))) 
      return '🔴'; // One-off expense
    if (item.expenses && item.expenses.length > 0) 
      return '🟡'; // Regular expense
    return '';
  }

  function getBalanceIcon(item) {
    // Check for emergency protection or low balance
    if (item.emergencyInjection && item.emergencyInjection > 0) return '🚨';
    if (item.endBalance < targetAmount) return '⚠️';
    return '';
  }

  function getSavingsIcon(item) {
    // Determine if savings were adjusted
    if (item.monthIndex > 0 && data[item.monthIndex - 1]) {
      const prevSavings = data[item.monthIndex - 1].monthlySaving;
      
      // Check if previous month had a one-off expense
      const prevHadOneOff = item.monthIndex > 0 && data[item.monthIndex - 1] && 
        data[item.monthIndex - 1].expenses && 
        data[item.monthIndex - 1].expenses.some(exp => exp.toLowerCase().includes('driveway'));
      
      if (prevHadOneOff && item.monthlySaving !== prevSavings) 
        return '★'; // Adjusted after one-off
      if (item.monthlySaving > prevSavings) 
        return '↑'; // Increased
      if (item.monthlySaving < prevSavings) 
        return '↓'; // Decreased
    }
    
    // Emergency injection
    if (item.emergencyInjection && item.emergencyInjection > 0) 
      return '†';
    
    return '';
  }
  
  // Helper functions for expense management
  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    
    const updatedExpenses = [...expenses, {
      ...newExpense,
      amount: parseFloat(newExpense.amount).toFixed(2)
    }];
    
    setExpenses(updatedExpenses);
    
    // Reset form
    setNewExpense({
      description: '',
      amount: '',
      recurrence: 'Annual',
      paymentSchedule: ''
    });
  };
  
  const handleRemoveExpense = (index) => {
    const updatedExpenses = [...expenses];
    updatedExpenses.splice(index, 1);
    setExpenses(updatedExpenses);
  };
  
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setNewExpense({
      ...newExpense,
      [name]: value
    });
  };
  
  // Edit expense handlers
  const handleOpenEditDialog = (expense, index) => {
    setEditingExpense({...expense});
    setEditingExpenseIndex(index);
    setIsEditDialogOpen(true);
  };
  
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
    setEditingExpenseIndex(-1);
  };
  
  const handleSaveEditedExpense = (editedExpense) => {
    if (editingExpenseIndex >= 0) {
      const updatedExpenses = [...expenses];
      updatedExpenses[editingExpenseIndex] = {
        ...editedExpense,
        amount: parseFloat(editedExpense.amount).toFixed(2)
      };
      setExpenses(updatedExpenses);
    }
  };
  
  // Income management functions
  const handleAddIncome = () => {
    if (!newIncome.description || !newIncome.amount) return;
    
    const updatedIncomes = [...incomes, {
      ...newIncome,
      amount: parseFloat(newIncome.amount).toFixed(2)
    }];
    
    setIncomes(updatedIncomes);
    
    // Reset form
    setNewIncome({
      description: '',
      amount: '',
      frequency: 'Monthly',
      month: ''
    });
  };
  
  const handleRemoveIncome = (index) => {
    const updatedIncomes = [...incomes];
    updatedIncomes.splice(index, 1);
    setIncomes(updatedIncomes);
  };
  
  const handleIncomeChange = (e) => {
    const { name, value } = e.target;
    setNewIncome({
      ...newIncome,
      [name]: value
    });
  };
  
  // CSV upload functionality
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
    }
  };
  
  const handleCsvUpload = () => {
    if (!csvFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsedExpenses = parseCSV(text);
      if (parsedExpenses && parsedExpenses.length > 0) {
        setExpenses(parsedExpenses);
        alert(`Successfully imported ${parsedExpenses.length} expenses from CSV`);
      } else {
        alert('Failed to parse CSV or no valid expenses found.');
      }
    };
    reader.readAsText(csvFile);
  };
  
  // Helper function to parse CSV data
  const parseCSV = (csvText) => {
    try {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Define indices for all possible columns in the template
      const categoryIndex = headers.indexOf('category');
      const subcategoryIndex = headers.indexOf('subcategory');
      const descriptionIndex = headers.indexOf('description');
      const amountIndex = headers.indexOf('amount');
      const recurrenceIndex = headers.indexOf('recurrence');
      const scheduleIndex = headers.indexOf('payment schedule');
      const endDateIndex = headers.indexOf('end date');
      
      // Check for required columns
      if (descriptionIndex === -1 || amountIndex === -1 || recurrenceIndex === -1) {
        alert('CSV must have at least Description, Amount and Recurrence columns');
        return [];
      }
      
      const parsedExpenses = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        
        // Skip if we don't have enough values
        if (values.length < Math.max(descriptionIndex, amountIndex, recurrenceIndex) + 1) {
          continue;
        }
        
        // Format the description to include category and subcategory if available
        let description = values[descriptionIndex]?.trim() || 'Unnamed Expense';
        if (categoryIndex !== -1 && subcategoryIndex !== -1) {
          const category = values[categoryIndex]?.trim();
          const subcategory = values[subcategoryIndex]?.trim();
          
          if (category && subcategory) {
            description = `${category} - ${subcategory}: ${description}`;
          } else if (category) {
            description = `${category}: ${description}`;
          }
        }
        
        // Get recurrence and ensure it's one of the allowed values
        let recurrence = values[recurrenceIndex]?.trim() || 'Annual';
        // Normalize recurrence values
        if (recurrence.toLowerCase() === 'monthly') recurrence = 'Monthly';
        else if (recurrence.toLowerCase() === 'annual') recurrence = 'Annual';
        else if (recurrence.toLowerCase() === 'irregular') recurrence = 'Irregular';
        else if (recurrence.toLowerCase() === 'one-off') recurrence = 'One-off';
        else recurrence = 'Annual'; // Default to Annual if unrecognized
        
        // Create the expense object
        const expense = {
          description,
          amount: parseFloat(values[amountIndex]?.replace(/[^0-9.]/g, '') || 0).toFixed(2),
          recurrence,
          paymentSchedule: scheduleIndex !== -1 ? (values[scheduleIndex]?.trim() || '') : '',
          endDate: endDateIndex !== -1 ? (values[endDateIndex]?.trim() || '') : ''
        };
        
        // Only add if amount is greater than 0
        if (expense.amount > 0) {
          parsedExpenses.push(expense);
        }
      }
      
      return parsedExpenses;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return [];
    }
  };

  return (
        <div className="App">
      <header className="App-header">
        <h1>Buffer saving account calculation details</h1>
        <p className="note">
          <strong>Note:</strong> Monthly savings amounts may vary to accommodate one-off expenses while keeping your buffer account above the minimum level.
        </p>
        <p className="explanation">
          <strong>How this works:</strong> Your account balance is maintained at or above your target balance at all times. Monthly savings remain constant except following a one-off payment, when the system recalculates the required savings amount to ensure financial stability.
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'input' ? 'active' : ''} 
          onClick={() => setActiveTab('input')}
        >
          Input
        </button>
        <button 
          className={activeTab === 'details' ? 'active' : ''} 
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button 
          className={activeTab === 'graph' ? 'active' : ''} 
          onClick={() => setActiveTab('graph')}
        >
          Graph
        </button>
        <button 
          className={activeTab === 'requirements' ? 'active' : ''} 
          onClick={() => setActiveTab('requirements')}
        >
          Requirements
        </button>
      </div>

      {/* Input Tab */}
      {activeTab === 'input' && (
        <div className="tab-content">
          <h2>Input Parameters</h2>
          
          <div className="input-section">
            <h3>Account Settings</h3>
            <div className="input-group">
              <label>
                Current Balance:
                <input 
                  type="number" 
                  value={currentAmount} 
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setCurrentAmount(value);
                  }} 
                />
              </label>
            </div>
            <div className="input-group">
              <label>
                Target Balance:
                <input 
                  type="number" 
                  value={targetAmount} 
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setTargetAmount(value);
                  }} 
                />
              </label>
            </div>
            <div className="input-group">
              <label>
                Adjustment Cycle (years):
                <select 
                  value={adjustmentCycle} 
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setAdjustmentCycle(value);
                  }}
                >
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                  <option value="5">5 Years</option>
                </select>
              </label>
            </div>
          </div>

          <div className="input-section">
            <h3>Income</h3>
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount (CHF)</th>
                  <th>Frequency</th>
                  <th>Month (if Annual)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income, index) => (
                  <tr key={index}>
                    <td>{income.description}</td>
                    <td>{formatCurrency(income.amount)}</td>
                    <td>{income.frequency}</td>
                    <td>{income.month}</td>
                    <td>
                      <button onClick={() => handleRemoveIncome(index)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="add-expense-form">
              <h4>Add New Income</h4>
              <div className="form-row">
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={newIncome.description}
                  onChange={handleIncomeChange}
                />
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount (CHF)"
                  value={newIncome.amount}
                  onChange={handleIncomeChange}
                />
                <select
                  name="frequency"
                  value={newIncome.frequency}
                  onChange={handleIncomeChange}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Annual">Annual</option>
                </select>
                {newIncome.frequency === 'Annual' && (
                  <select
                    name="month"
                    value={newIncome.month}
                    onChange={handleIncomeChange}
                  >
                    <option value="">Select Month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                )}
                <button onClick={handleAddIncome}>Add</button>
              </div>
            </div>
          </div>

          <div className="input-section">
            <h3>Expenses</h3>
            
            <div className="csv-upload-section">
              <h4>Import Expenses from CSV</h4>
              <div className="form-row">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <button 
                  onClick={handleCsvUpload} 
                  disabled={!csvFile}
                  className={!csvFile ? 'disabled-button' : ''}
                >
                  Upload CSV
                </button>
              </div>
              <p className="csv-hint">
                CSV should have these headers: Category,Subcategory,Description,Amount,Recurrence,Payment Schedule,End Date
              </p>
              <div className="template-info">
                <h5>Expected Format:</h5>
                <ul>
                  <li><strong>Category:</strong> Tax, Cars, Insurance, etc.</li>
                  <li><strong>Subcategory:</strong> Further classification (Canton, Legal, etc.)</li>
                  <li><strong>Description:</strong> Name of the expense</li>
                  <li><strong>Amount:</strong> Numeric value (e.g., 1000, 346.90)</li>
                  <li><strong>Recurrence:</strong> Monthly, Annual, Irregular, or One-off</li>
                  <li><strong>Payment Schedule:</strong> 
                    <ul>
                      <li>For Annual: DD.MM (e.g., 15.11)</li>
                      <li>For Irregular: DD.MM;DD.MM;DD.MM (multiple dates separated by semicolons)</li>
                      <li>For One-off: DD.MM.YYYY (e.g., 01.11.2026)</li>
                    </ul>
                  </li>
                  <li><strong>End Date:</strong> DD/MM/YYYY (e.g., 31/12/2030)</li>
                </ul>
                <p><a href="#" onClick={(e) => {
                  e.preventDefault();
                  const templateContent = "Category,Subcategory,Description,Amount,Recurrence,Payment Schedule,End Date\n" +
                    "Tax,Canton,Tax Installments,1000,Annual,15.11,31/12/2025\n" + 
                    "Insurance,Home,AXA Household Insurance,1144.05,Annual,01.03,31/12/2030\n" +
                    "Utility,Electricity,Electricity Bill,1937,Annual,01.01,31/12/2030\n" +
                    "House,Investment,Driveway,22000,One-off,01.11.2026,30/12/2026";
                  
                  const blob = new Blob([templateContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('hidden', '');
                  a.setAttribute('href', url);
                  a.setAttribute('download', 'expense_template.csv');
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}>Download Template CSV</a></p>
              </div>
            </div>
            
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount (CHF)</th>
                  <th>Recurrence</th>
                  <th>Payment Schedule</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => (
                  <tr key={index}>
                    <td>{expense.description}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                    <td>{expense.recurrence}</td>
                    <td>{expense.paymentSchedule}</td>
                    <td className="action-buttons-cell">
                      <button 
                        className="edit-button"
                        onClick={() => handleOpenEditDialog(expense, index)}
                      >
                        Edit
                      </button>
                      <button 
                        className="remove-button"
                        onClick={() => handleRemoveExpense(index)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="add-expense-form">
              <h4>Add New Expense</h4>
              <div className="form-row">
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={newExpense.description}
                  onChange={handleExpenseChange}
                />
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount (CHF)"
                  value={newExpense.amount}
                  onChange={handleExpenseChange}
                />
                <select
                  name="recurrence"
                  value={newExpense.recurrence}
                  onChange={handleExpenseChange}
                >
                  <option value="Annual">Annual</option>
                  <option value="Irregular">Irregular</option>
                  <option value="One-off">One-off</option>
                </select>
                <input
                  type="text"
                  name="paymentSchedule"
                  placeholder={
                    newExpense.recurrence === 'Annual' ? 'DD.MM' : 
                    newExpense.recurrence === 'One-off' ? 'DD.MM.YYYY' : 
                    'DD.MM;DD.MM;...'
                  }
                  value={newExpense.paymentSchedule}
                  onChange={handleExpenseChange}
                />
                <button onClick={handleAddExpense}>Add</button>
              </div>
            </div>
            
            <div className="action-buttons">
              <button onClick={() => setActiveTab('details')}>View Details</button>
            </div>
          </div>
        </div>
      )}


      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="tab-content">
          <h2>Calculation Results</h2>
          
          <div className="results-summary">
            <div className="result-card">
              <h3>Monthly Savings</h3>
              <div className="result-value">CHF 6,900.00</div>
            </div>
            
            <div className="result-card">
              <h3>Starting Balance</h3>
              <div className="result-value">{formatCurrency(currentAmount)}</div>
            </div>
            
            <div className="result-card">
              <h3>Target Balance</h3>
              <div className="result-value">{formatCurrency(targetAmount)}</div>
            </div>
            
            <div className="result-card">
              <h3>Final Balance</h3>
              <div className="result-value">
                {data.length > 0 ? formatCurrency(data[data.length - 1]?.endBalance) : 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="key-insights">
            <h3>Key Insights</h3>
            <ul>
              {data.length > 0 && (
                <>
                  {data.some(month => month.expenses && month.expenses.some(exp => typeof exp === 'string' && exp.toLowerCase().includes('driveway'))) && (
                    <li>Your monthly saving will be CHF 6,900 until the one-off payment (driveway) in Sep 2026, then the monthly payment will be reduced to CHF 6,428.33.</li>
                  )}
                  <li>Your final balance after projection will be {formatCurrency(data[data.length - 1]?.endBalance)}.</li>
                  <li>Your driveway expense is fully accounted for in the calculation.</li>
                </>
              )}
            </ul>
          </div>
          
          <h3>Monthly Calculation Details</h3>
          
          <div className="calculation-table">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Start Balance</th>
                  <th>Monthly Saving</th>
                  <th>Expenses</th>
                  <th>Total Expenses</th>
                  <th>End Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  // Determine row styling and indicators
                  const rowClass = getRowClass(item);
                  const expenseIcon = getExpenseIcon(item);
                  const balanceIcon = getBalanceIcon(item);
                  const savingsIcon = getSavingsIcon(item);
                  
                  // Mark when savings change
                  const prevMonth = index > 0 ? data[index-1] : null;
                  const savingsChanged = prevMonth && prevMonth.monthlySaving !== item.monthlySaving;
                  
                  // Special styling for the month after a one-off payment
                  const afterOneOff = prevMonth && 
                    prevMonth.expenses && 
                    prevMonth.expenses.some(exp => typeof exp === 'string' && exp.toLowerCase().includes('driveway'));
                  
                  return (
                    <tr 
                      key={index} 
                      className={rowClass}
                      style={savingsChanged ? {borderTop: '2px solid #666'} : {}}
                    >
                      <td>{item.month}</td>
                      <td>{formatCurrency(item.startBalance)}</td>
                      <td>
                        {formatCurrency(item.monthlySaving)} {savingsIcon}
                        {savingsChanged && <span style={{color: 'purple'}}> ★</span>}
                      </td>
                      <td>
                        {expenseIcon} {Array.isArray(item.expenses) ? item.expenses.join(', ') : item.expenses}
                      </td>
                      <td>{formatCurrency(item.totalExpenses)}</td>
                      <td>
                        {formatCurrency(item.endBalance)} {balanceIcon}
                        {item.emergencyInjection && item.emergencyInjection > 0 && <span style={{color: 'red'}}> 🚨</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="legend">
            <h3>Legend:</h3>
            <div className="legend-grid">
              <div className="legend-column">
                <p><span className="one-off-expense-marker"></span> Month with one-off expense (red)</p>
                <p><span className="regular-expense-marker"></span> Month with regular expense (yellow)</p>
                <p><span className="after-payment-marker"></span> Month with savings adjustment after one-off payment</p>
                <p><span className="savings-adjustment-marker"></span> Changed monthly savings amount</p>
                <p><span className="temporary-increase-marker"></span> Temporary savings increase to maintain target balance</p>
              </div>
              <div className="legend-column">
                <p>🔴 One-off expense</p>
                <p>🟡 Regular expense (annual/irregular)</p>
                <p>⚠️ Below target balance warning</p>
                <p>↑ Increased monthly savings</p>
                <p>↓ Decreased monthly savings</p>
              </div>
              <div className="legend-column">
                <p>★ Monthly savings adjusted after one-off payment</p>
                <p>† Extra savings to maintain target balance</p>
                <p>⚡ Smoothing adjustment (gradual increase)</p>
                <p>⚡ Smoothing adjustment (gradual decrease)</p>
                <p>🚨 Emergency savings increase (prevents balance from falling below target)</p>
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button onClick={() => setActiveTab('input')}>Modify Inputs</button>
            <button onClick={() => setActiveTab('graph')}>View Graph</button>
          </div>
        </div>
      )}
      
      {/* Graph Tab */}
      {activeTab === 'graph' && (
        <div className="tab-content">
          <h2>Balance Evolution Graph</h2>
          
          <div className="graph-container">
            {data.length > 0 ? (
              <Line
                data={{
                  labels: data.map(item => item.month),
                  datasets: [
                    // Balance as a step line chart
                    {
                      type: 'line',
                      label: 'End of Month Balance',
                      data: data.map(item => item.endBalance),
                      borderColor: 'rgb(41, 128, 185)',
                      backgroundColor: 'rgba(41, 128, 185, 0.2)',
                      borderWidth: 3,
                      pointRadius: 3,
                      pointHoverRadius: 6,
                      stepped: true,
                      tension: 0,
                    },
                    // Target Balance line
                    {
                      type: 'line',
                      label: 'Target Balance',
                      data: data.map(() => targetAmount),
                      borderColor: 'rgba(192, 57, 43, 0.5)',
                      backgroundColor: 'rgba(192, 57, 43, 0.1)',
                      borderDash: [5, 5],
                      borderWidth: 1.5,
                      pointRadius: 0,
                      stepped: false,
                    },
                    // Monthly Savings as bars
                    {
                      type: 'bar',
                      label: 'Monthly Savings',
                      data: data.map(item => item.monthlySaving),
                      backgroundColor: 'rgba(46, 204, 113, 0.3)',
                      borderColor: 'rgba(46, 204, 113, 0.6)',
                      borderWidth: 0.5,
                      yAxisID: 'y1',
                      order: 1,
                      barPercentage: 0.5,
                      categoryPercentage: 0.7,
                    }
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Balance Evolution & Monthly Savings',
                      font: {
                        size: 16
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', { 
                              style: 'currency', 
                              currency: 'CHF',
                              minimumFractionDigits: 2
                            }).format(context.parsed.y);
                          }
                          return label;
                        }
                      }
                    },
                    // Disable data labels
                    datalabels: {
                      display: false
                    },
                    // Add subtle annotation for one-off expenses
                    annotation: {
                      annotations: data
                        .map((item, index) => {
                          // Check if this month has one-off expenses
                          if (item.expenses && item.expenses.some(exp => 
                            typeof exp === 'string' && 
                            (exp.toLowerCase().includes('driveway') || 
                             exp.toLowerCase().includes('one-off'))
                          )) {
                            return {
                              type: 'point',
                              xValue: index,
                              yValue: item.endBalance,
                              backgroundColor: 'rgba(231, 76, 60, 0.7)',
                              borderColor: 'white',
                              borderWidth: 1,
                              radius: 6,
                              pointStyle: 'circle',
                            };
                          }
                          return null;
                        })
                        .filter(annotation => annotation !== null)
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                      },
                      ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 12
                      }
                    },
                    y: {
                      position: 'left',
                      grid: {
                        color: 'rgba(200, 200, 200, 0.3)',
                        lineWidth: 0.5
                      },
                      beginAtZero: false,
                      title: {
                        display: true,
                        text: 'Balance (CHF)',
                        padding: {top: 10, bottom: 10}
                      },
                      ticks: {
                        maxTicksLimit: 6,
                        callback: function(value) {
                          return new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'CHF',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(value);
                        }
                      }
                    },
                    y1: {
                      position: 'right',
                      grid: {
                        display: false
                      },
                      beginAtZero: true,
                      border: {
                        display: false
                      },
                      title: {
                        display: true,
                        text: 'Monthly Savings',
                        padding: {top: 10, bottom: 10},
                        color: 'rgba(46, 204, 113, 0.8)'
                      },
                      ticks: {
                        maxTicksLimit: 5,
                        color: 'rgba(46, 204, 113, 0.8)',
                        callback: function(value) {
                          return new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'CHF',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(value);
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <p className="no-data-message">No data available. Please calculate first.</p>
            )}
          </div>
          
          <div className="graph-insights">
            <h3>Graph Insights</h3>
            {data.length > 0 && (
              <ul>
                <li>The blue step line shows your projected balance at the end of each month.</li>
                <li>The red dashed line represents your target balance of {formatCurrency(targetAmount)}.</li>
                <li>Green bars represent your monthly savings amounts.</li>
                <li>Red dots indicate months with significant one-off payments.</li>
                {data.some(month => month.expenses && month.expenses.some(exp => 
                  typeof exp === 'string' && (
                    exp.toLowerCase().includes('one-off') || 
                    exp.toLowerCase().includes('driveway') ||
                    exp.toLowerCase().includes('annual')
                  ))) && (
                  <li>Notice the impact of one-off expenses on your buffer account balance.</li>
                )}
                {data.some(month => month.endBalance < targetAmount) ? (
                  <li className="warning">Warning: Your balance falls below the target in some months.</li>
                ) : (
                  <li className="success">Your balance stays above the target throughout the projection period.</li>
                )}
              </ul>
            )}
          </div>
          
          <div className="action-buttons">
            <button onClick={() => setActiveTab('details')}>View Detailed Table</button>
            <button onClick={() => setActiveTab('input')}>Modify Inputs</button>
          </div>
        </div>
      )}
      
      {/* Requirements Tab */}
      {activeTab === 'requirements' && (
        <div className="tab-content">
          <h2>Application Requirements</h2>
          
          <div className="requirements-container">
            <h3>Core Requirements</h3>
            <ul className="requirements-list">
              <li>Calculate monthly savings needed to maintain minimum buffer account balance</li>
              <li>Handle regular annual expenses with specified payment dates</li>
              <li>Accommodate one-off expenses with specific future dates</li>
              <li>Recalculate savings amounts after major expenses</li>
              <li>Maintain target minimum balance at all times</li>
              <li>Generate monthly balance projections</li>
            </ul>
            
            <h3>Expense Management</h3>
            <ul className="requirements-list">
              <li>Support for multiple expense types:
                <ul>
                  <li>Annual recurring expenses</li>
                  <li>Irregular expenses (multiple dates per year)</li>
                  <li>One-off future expenses</li>
                </ul>
              </li>
              <li>Flexible payment schedule entry formats</li>
              <li>CSV import functionality for bulk expense entry</li>
              <li>Individual expense editing and deletion</li>
            </ul>
            
            <h3>Income Management</h3>
            <ul className="requirements-list">
              <li>Support for monthly and annual income sources</li>
              <li>Month specification for annual income</li>
              <li>Total annual income calculation and display</li>
            </ul>
            
            <h3>Configuration Options</h3>
            <ul className="requirements-list">
              <li>Adjustable current account balance</li>
              <li>Configurable target minimum balance</li>
              <li>Selectable adjustment cycle (1, 2, or 5 years)</li>
            </ul>
            
            <h3>Visualization and Reporting</h3>
            <ul className="requirements-list">
              <li>Monthly calculation breakdown table</li>
              <li>Interactive balance evolution graph</li>
              <li>Visual indicators for:
                <ul>
                  <li>One-off expenses</li>
                  <li>Regular expenses</li>
                  <li>Savings adjustments</li>
                  <li>Low balance warnings</li>
                </ul>
              </li>
              <li>Key financial insights summary</li>
            </ul>
          </div>
          
          <div className="action-buttons">
            <button onClick={() => setActiveTab('input')}>Return to Input</button>
            <button onClick={() => setActiveTab('graph')}>View Graph</button>
          </div>
        </div>
      )}
      
      {/* Edit Dialog */}
      <EditDialog 
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        expense={editingExpense || {}}
        onSave={handleSaveEditedExpense}
      />
    </div>
  );
}

export default App; 