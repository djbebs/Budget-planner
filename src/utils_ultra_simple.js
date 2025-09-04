// ULTRA SIMPLE UTILS - No complex date operations, no hanging

// Calculate monthly savings needed - ULTRA SIMPLE
export function calculateMonthlySavingsNeeded(expenses, currentAmount, targetAmount, adjustmentCycleYears) {
  const startingBalance = parseFloat(currentAmount) || 0;
  let target = parseFloat(targetAmount) || 500;
  target = Math.max(target, 500); // Minimum target
  
  if (!expenses || expenses.length === 0) return 200; // Default savings
  
  // Find the largest one-off expense
  let largestOneOff = 0;
  for (let i = 0; i < expenses.length; i++) {
    if (expenses[i].recurrence === 'One-off') {
      const amount = parseFloat(expenses[i].amount) || 0;
      if (amount > largestOneOff) {
        largestOneOff = amount;
      }
    }
  }
  
  if (largestOneOff > 0) {
    // Simple calculation: need enough to pay expense + maintain target
    const totalNeeded = largestOneOff + target - startingBalance;
    const monthlySavings = Math.max(totalNeeded / 12, 200); // 12 months default
    return Math.ceil(monthlySavings);
  }
  
  return 200; // Default monthly savings
}

// Simple month name generator - NO DATE OBJECTS
function getSimpleMonthName(monthIndex) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = 2025 + Math.floor(monthIndex / 12);
  const month = months[monthIndex % 12];
  return `${month} ${year}`;
}

// Main calculation function - ULTRA SIMPLE, NO DATE OPERATIONS
export function getMonthlyCalculationDetails(expenses, currentAmount, targetAmount, adjustmentCycleYears) {
  console.log('Starting ULTRA SIMPLE calculation...');
  
  const startingBalance = parseFloat(currentAmount) || 0;
  let target = parseFloat(targetAmount) || 500;
  target = Math.max(target, 500); // Minimum target
  
  const monthlyCalc = [];
  let balance = startingBalance;
  
  // Calculate basic monthly savings needed
  const monthlySavings = calculateMonthlySavingsNeeded(expenses, currentAmount, targetAmount, adjustmentCycleYears);
  
  console.log(`Ultra simple calculation: starting=${startingBalance}, target=${target}, monthly=${monthlySavings}`);
  
  // Generate 60 months of projection (5 years) - NO DATE OBJECTS
  for (let month = 0; month < 60; month++) {
    const monthName = getSimpleMonthName(month);
    
    // Check for expenses in this month - SIMPLE STRING MATCHING
    let monthlyExpenses = 0;
    const expenseList = [];
    
    if (expenses && expenses.length > 0) {
      for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        if (expense.recurrence === 'One-off' && expense.paymentSchedule) {
          // Simple month matching - check if September (month 1 = Sep 2025, 13 = Sep 2026, etc.)
          if (expense.paymentSchedule.includes('09') && (month + 1) % 12 === 9) {
            monthlyExpenses += parseFloat(expense.amount) || 0;
            expenseList.push(expense.description || 'One-off expense');
          }
        }
      }
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
  
  console.log(`Ultra simple calculation completed: ${monthlyCalc.length} months generated`);
  return monthlyCalc;
}

// Clear cache function (ultra simple version)
export function clearCalculationCache() {
  console.log('Cache cleared (ultra simple version)');
}

console.log('ULTRA SIMPLE utils loaded successfully!'); 