// NEW SIMPLE UTILS - No hanging, target balance focused

// Simple date parsing
function parseDate(dateStr) {
  if (!dateStr) return new Date('2030-12-31');
  if (dateStr.includes('-')) return new Date(dateStr);
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.');
    return new Date(`${year || new Date().getFullYear()}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  return new Date('2030-12-31');
}

// Calculate monthly savings needed - SIMPLE VERSION
export function calculateMonthlySavingsNeeded(expenses, currentAmount, targetAmount, adjustmentCycleYears) {
  const startingBalance = parseFloat(currentAmount) || 0;
  let target = parseFloat(targetAmount) || startingBalance * 0.1;
  
  // Ensure reasonable minimum target
  target = Math.max(target, 500);
  
  if (!expenses || expenses.length === 0) return 100; // Default savings
  
  // Find the largest one-off expense
  const oneOffExpenses = expenses.filter(exp => exp.recurrence === 'One-off');
  const largestOneOff = oneOffExpenses.reduce((max, exp) => 
    Math.max(max, parseFloat(exp.amount) || 0), 0);
  
  if (largestOneOff > 0) {
    // Calculate months until the one-off expense
    const today = new Date();
    const nextYear = today.getFullYear() + 1;
    const monthsUntilExpense = 12; // Assume 12 months as default
    
    // Calculate required monthly savings: need enough to pay expense + maintain target
    const totalNeeded = largestOneOff + target - startingBalance;
    const monthlySavings = Math.max(totalNeeded / monthsUntilExpense, 100);
    
    return Math.ceil(monthlySavings);
  }
  
  return 100; // Default monthly savings
}

// Main calculation function - SIMPLE VERSION
export function getMonthlyCalculationDetails(expenses, currentAmount, targetAmount, adjustmentCycleYears) {
  console.log('Starting SIMPLE calculation...');
  
  const startingBalance = parseFloat(currentAmount) || 0;
  let target = parseFloat(targetAmount) || startingBalance * 0.1;
  target = Math.max(target, 500); // Minimum target
  
  const monthlyCalc = [];
  let balance = startingBalance;
  
  // Calculate basic monthly savings needed
  const monthlySavings = calculateMonthlySavingsNeeded(expenses, currentAmount, targetAmount, adjustmentCycleYears);
  
  console.log(`Simple calculation: starting=${startingBalance}, target=${target}, monthly=${monthlySavings}`);
  
  // Generate 60 months of projection (5 years)
  const today = new Date();
  
  for (let month = 0; month < 60; month++) {
    const currentDate = new Date(today.getFullYear(), today.getMonth() + month + 1, 1);
    const monthName = currentDate.toLocaleDateString('en', { month: 'short', year: 'numeric' });
    
    // Check for expenses in this month
    let monthlyExpenses = 0;
    const expenseList = [];
    
    if (expenses) {
      expenses.forEach(expense => {
        if (expense.recurrence === 'One-off' && expense.paymentSchedule) {
          const [day, payMonth] = expense.paymentSchedule.split('.');
          const expenseMonth = parseInt(payMonth) - 1;
          const expenseYear = currentDate.getFullYear();
          
          if (currentDate.getMonth() === expenseMonth && 
              currentDate.getFullYear() >= expenseYear) {
            monthlyExpenses += parseFloat(expense.amount) || 0;
            expenseList.push(expense.description);
          }
        }
      });
    }
    
    const startBalance = balance;
    
    // Apply savings and expenses
    balance += monthlySavings;
    balance -= monthlyExpenses;
    
    // SAFETY CHECK: If balance would go below target, increase savings
    let adjustedSavings = monthlySavings;
    if (balance < target) {
      const deficit = target - balance + 500; // Add 500 CHF buffer
      adjustedSavings = monthlySavings + deficit;
      balance = startBalance + adjustedSavings - monthlyExpenses;
      console.log(`Adjusted savings for ${monthName}: ${adjustedSavings} (was ${monthlySavings})`);
    }
    
    monthlyCalc.push({
      month: monthName,
      date: monthName,
      startBalance: startBalance,
      monthlySaving: adjustedSavings,
      expenses: expenseList,
      totalExpenses: monthlyExpenses,
      endBalance: balance,
      isAdjustingToInitial: false,
      hasSignificantExpense: monthlyExpenses > 1000,
      isInAdjustmentCycle: false,
      isReducedSavings: false,
      belowTargetBalance: balance < target,
      belowZero: balance < 0,
      monthIndex: month
    });
    
    // Stop if we go negative (safety check)
    if (balance < 0) {
      console.warn('Balance went negative, stopping projection');
      break;
    }
  }
  
  console.log(`Simple calculation completed: ${monthlyCalc.length} months generated`);
  return monthlyCalc;
}

// Clear cache function (simple version)
export function clearCalculationCache() {
  console.log('Cache cleared (simple version)');
}

console.log('NEW SIMPLE utils loaded successfully!'); 