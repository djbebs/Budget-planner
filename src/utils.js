// Baseline Monthly Savings Calculator with Integrated One-Off Payments
// Implementation of the revised structural requirements

const calculationCache = new Map();

/**
 * Calculate baseline monthly savings needed for recurring expenses until end of planning horizon
 */
function calculateBaselineMonthlySavings(expenses, planningEndDate) {
  const recurringExpenses = expenses.filter(exp => exp.recurrence === 'Monthly');
  const monthlyRecurringTotal = recurringExpenses.reduce((sum, exp) => {
    return sum + (parseFloat(exp.amount) || 0);
  }, 0);
  
  // For recurring expenses, we need to maintain enough to cover them until planning end
  // This is a simplified baseline - in practice you might want a more sophisticated calculation
  return monthlyRecurringTotal * 0.1; // Keep 10% of monthly expenses as baseline savings
}

/**
 * Calculate monthly contribution needed for a one-off payment
 */
function calculateOneOffContribution(oneOffExpense, startDate, targetAmount) {
  let paymentDate;
  
  // Parse the payment date from the expense
  if (oneOffExpense.oneOffDate) {
    paymentDate = new Date(oneOffExpense.oneOffDate);
  } else if (oneOffExpense.paymentSchedule) {
    const [day, month] = oneOffExpense.paymentSchedule.split('.');
    const currentYear = startDate.getFullYear();
    paymentDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
    
    // If the payment date is in the past, move it to next year
    if (paymentDate <= startDate) {
      paymentDate.setFullYear(currentYear + 1);
    }
  } else {
    // Default to 12 months from now if no date specified
    paymentDate = new Date(startDate);
    paymentDate.setFullYear(startDate.getFullYear() + 1);
  }
  
  // Calculate months until payment
  const monthsUntil = Math.max(1, Math.ceil(
    (paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
    (paymentDate.getMonth() - startDate.getMonth())
  ));
  
  const expenseAmount = parseFloat(oneOffExpense.amount) || 0;
  
  // Monthly contribution = expense amount / months until due
  return {
    monthlyContribution: expenseAmount / monthsUntil,
    paymentDate: paymentDate,
    monthsUntil: monthsUntil,
    expenseAmount: expenseAmount,
    description: oneOffExpense.description || 'One-off expense'
  };
}

/**
 * Main function: Calculate monthly savings needed using forward-looking approach
 */
export function calculateMonthlySavingsNeeded(expenses, currentAmount, targetAmount, adjustmentCycleYears) {
  console.log('🚨 FORWARD-LOOKING CALCULATION APPROACH 🚨');
  
  if (!expenses || expenses.length === 0) return 0;
  
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Start from next month
  const planningEndDate = new Date('2030-09-30'); // End in September 2030
  
  const startingBalance = parseFloat(currentAmount) || 0;
  let target = parseFloat(targetAmount) || 0;
  
  // Ensure reasonable minimum target
  if (target <= 0) {
    target = Math.max(startingBalance * 0.1, 500);
  }
  
  console.log(`Starting calculation: Balance=${startingBalance}, Target=${target}`);
  
  // Calculate all regular expenses for the entire period
  const allRegularExpenses = calculateAllRegularExpenses(expenses, startDate, planningEndDate);
  const totalRegularExpenses = allRegularExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Calculate all one-off expenses
  const oneOffExpenses = expenses.filter(exp => exp.recurrence === 'One-off');
  const totalOneOffExpenses = oneOffExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  
  // Calculate total expenses and required monthly savings
  const totalExpenses = totalRegularExpenses + totalOneOffExpenses;
  const monthsToProject = Math.min(60, (planningEndDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                        (planningEndDate.getMonth() - startDate.getMonth()));
  
  // The correct formula: (Total Expenses + Target Balance - Starting Balance) / Number of Months
  const requiredSavings = (totalExpenses + target - startingBalance) / monthsToProject;
  
  // Verify that we can afford each one-off payment when it's due
  let maxRequiredSavings = requiredSavings;
  oneOffExpenses.forEach(oneOff => {
    const monthsUntilPayment = Math.max(1, Math.ceil(
      (oneOff.paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
      (oneOff.paymentDate.getMonth() - startDate.getMonth())
    ));
    
    // Calculate what we need to save to have enough for the payment + maintain target balance
    const totalNeededForPayment = (parseFloat(oneOff.amount) || 0) + target;
    const currentSavings = startingBalance;
    const additionalSavingsNeeded = totalNeededForPayment - currentSavings;
    const requiredMonthlySavingsForThisPayment = additionalSavingsNeeded / monthsUntilPayment;
    
    maxRequiredSavings = Math.max(maxRequiredSavings, requiredMonthlySavingsForThisPayment);
  });
  
  const finalRequiredSavings = maxRequiredSavings;
  
  console.log(`Total regular expenses: ${totalRegularExpenses.toFixed(2)} CHF`);
  console.log(`Total one-off expenses: ${totalOneOffExpenses.toFixed(2)} CHF`);
  console.log(`Total expenses: ${totalExpenses.toFixed(2)} CHF`);
  console.log(`Initial required monthly savings: ${requiredSavings.toFixed(2)} CHF`);
  console.log(`Final required monthly savings: ${finalRequiredSavings.toFixed(2)} CHF`);
  
  // Ensure minimum savings amount
  const result = Math.max(finalRequiredSavings, 50);
  
  return Math.ceil(result);
}

/**
 * Calculate all regular expenses (annual, irregular) for the entire planning period
 */
function calculateAllRegularExpenses(expenses, startDate, endDate) {
  const regularExpenses = expenses.filter(exp => 
    exp.recurrence === 'Annual' || exp.recurrence === 'Irregular'
  );
  
  console.log('Processing regular expenses:', regularExpenses.map(exp => ({
    description: exp.description,
    amount: exp.amount,
    recurrence: exp.recurrence,
    paymentSchedule: exp.paymentSchedule
  })));
  
  const allExpenses = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    let monthExpenses = 0;
    let monthExpenseDescriptions = [];
    
    regularExpenses.forEach(expense => {
      if (expense.recurrence === 'Annual') {
        // Check if this is the month for annual payment
        if (expense.paymentSchedule) {
          const [day, monthStr] = expense.paymentSchedule.split('.');
          const expenseMonth = parseInt(monthStr) - 1; // Convert to 0-based month
          if (expenseMonth === currentDate.getMonth()) {
            monthExpenses += parseFloat(expense.amount) || 0;
            monthExpenseDescriptions.push(expense.description || expense.category);
          }
        }
      } else if (expense.recurrence === 'Irregular') {
        // Check if this month matches any of the irregular payment dates
        if (expense.paymentSchedule) {
          const paymentDates = expense.paymentSchedule.split(';').map(dateStr => {
            const [day, monthStr] = dateStr.trim().split('.');
            return { day: parseInt(day), month: parseInt(monthStr) - 1 };
          });
          
          const currentMonth = currentDate.getMonth();
          
          // Check if this month has any payments (ignore the day since we're calculating monthly)
          const isPaymentMonth = paymentDates.some(pd => pd.month === currentMonth);
          
          if (isPaymentMonth) {
            // For irregular expenses, divide the total amount by the number of payment dates
            const monthlyAmount = (parseFloat(expense.amount) || 0) / paymentDates.length;
            monthExpenses += monthlyAmount;
            monthExpenseDescriptions.push(expense.description || expense.category);
            
            console.log(`Irregular expense ${expense.description}: ${monthlyAmount.toFixed(2)} CHF in ${currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}`);
          }
        }
      }
    });
    
    if (monthExpenses > 0) {
      allExpenses.push({
        month: currentDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        amount: monthExpenses,
        descriptions: monthExpenseDescriptions
      });
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return allExpenses;
}

/**
 * Generate detailed monthly calculation with forward-looking approach
 */
export function getMonthlyCalculationDetails(expenses, currentAmount, targetAmount, adjustmentCycleYears) {
  console.log('🚨 FORWARD-LOOKING CALCULATION APPROACH 🚨');
  
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const planningEndDate = new Date('2030-09-30'); // End in September 2030 as requested
  
  const monthsToProject = Math.min(60, (planningEndDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                        (planningEndDate.getMonth() - startDate.getMonth()));
  
  const startingBalance = parseFloat(currentAmount) || 0;
  let target = parseFloat(targetAmount) || 0;
  
  if (target <= 0) {
    target = Math.max(startingBalance * 0.1, 500);
  }
  
  console.log(`Generating ${monthsToProject} months of projection from ${startDate.toISOString().slice(0,7)} to ${planningEndDate.toISOString().slice(0,7)}`);
  
  // Calculate all regular expenses for the entire period
  const allRegularExpenses = calculateAllRegularExpenses(expenses, startDate, planningEndDate);
  console.log('Regular expenses schedule:', allRegularExpenses);
  
  // Debug: Check for School Fees specifically
  const schoolFeesExpenses = allRegularExpenses.filter(exp => 
    exp.descriptions.some(desc => desc.toLowerCase().includes('school'))
  );
  console.log('School Fees expenses found:', schoolFeesExpenses);
  
  // Prepare one-off expenses with their payment months
  const oneOffExpenses = expenses.filter(exp => exp.recurrence === 'One-off').map(expense => {
    const contribution = calculateOneOffContribution(expense, startDate, target);
    const monthIndex = Math.max(0, Math.ceil(
      (contribution.paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
      (contribution.paymentDate.getMonth() - startDate.getMonth())
    ));
    
    return {
      ...expense,
      paymentMonth: Math.min(monthIndex, monthsToProject - 1),
      monthlyContribution: contribution.monthlyContribution,
      expenseAmount: contribution.expenseAmount,
      paymentDate: contribution.paymentDate
    };
  });
  
  console.log('One-off expenses schedule:');
  oneOffExpenses.forEach(exp => {
    console.log(`  ${exp.description}: ${exp.expenseAmount} CHF in month ${exp.paymentMonth} (${exp.paymentDate.toISOString().slice(0,7)})`);
  });
  
  // Calculate total expenses over the entire period
  const totalRegularExpenses = allRegularExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalOneOffExpenses = oneOffExpenses.reduce((sum, exp) => sum + exp.expenseAmount, 0);
  const totalExpenses = totalRegularExpenses + totalOneOffExpenses;
  
  // Calculate required monthly savings to cover all expenses and maintain target balance
  // The formula should be: (Total Expenses + Target Balance - Starting Balance) / Number of Months
  // But we need to ensure we have enough savings by the time each one-off payment is due
  const requiredSavings = (totalExpenses + target - startingBalance) / monthsToProject;
  
  // Verify that we can afford each one-off payment when it's due
  let maxRequiredSavings = requiredSavings;
  oneOffExpenses.forEach(oneOff => {
    const monthsUntilPayment = oneOff.paymentMonth;
    
    // Calculate regular expenses that occur before this one-off payment
    const regularExpensesBeforePayment = allRegularExpenses
      .filter(exp => {
        const expMonthIndex = allRegularExpenses.indexOf(exp);
        return expMonthIndex < monthsUntilPayment;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate what we need to save to have enough for the payment + maintain target balance
    // We need: payment amount + target balance + regular expenses before payment
    const totalNeededForPayment = oneOff.expenseAmount + target + regularExpensesBeforePayment;
    const currentSavings = startingBalance;
    const additionalSavingsNeeded = totalNeededForPayment - currentSavings;
    const requiredMonthlySavingsForThisPayment = additionalSavingsNeeded / monthsUntilPayment;
    
    console.log(`One-off ${oneOff.description}: ${oneOff.expenseAmount} CHF in month ${monthsUntilPayment}`);
    console.log(`  Regular expenses before payment: ${regularExpensesBeforePayment.toFixed(2)} CHF`);
    console.log(`  Total needed (payment + target + regular): ${totalNeededForPayment.toFixed(2)} CHF`);
    console.log(`  Current savings: ${currentSavings.toFixed(2)} CHF`);
    console.log(`  Additional savings needed: ${additionalSavingsNeeded.toFixed(2)} CHF`);
    console.log(`  Required monthly savings for this payment: ${requiredMonthlySavingsForThisPayment.toFixed(2)} CHF`);
    
    maxRequiredSavings = Math.max(maxRequiredSavings, requiredMonthlySavingsForThisPayment);
  });
  
  const finalRequiredSavings = maxRequiredSavings;
  
  console.log(`Starting balance: ${startingBalance.toFixed(2)} CHF`);
  console.log(`Target balance: ${target.toFixed(2)} CHF`);
  console.log(`Total regular expenses: ${totalRegularExpenses.toFixed(2)} CHF`);
  console.log(`Total one-off expenses: ${totalOneOffExpenses.toFixed(2)} CHF`);
  console.log(`Total expenses: ${totalExpenses.toFixed(2)} CHF`);
  console.log(`Months to project: ${monthsToProject}`);
  console.log(`Initial required monthly savings: ${requiredSavings.toFixed(2)} CHF`);
  console.log(`Final required monthly savings: ${finalRequiredSavings.toFixed(2)} CHF`);
  
  // Verify the calculation makes sense
  const totalSavingsNeeded = finalRequiredSavings * monthsToProject;
  const expectedFinalBalance = startingBalance + totalSavingsNeeded - totalExpenses;
  console.log(`Total savings over period: ${totalSavingsNeeded.toFixed(2)} CHF`);
  console.log(`Expected final balance: ${expectedFinalBalance.toFixed(2)} CHF`);
  
  // Generate monthly projections
  const monthlyCalc = [];
  let balance = startingBalance;
  let remainingOneOffs = [...oneOffExpenses]; // Track which one-offs haven't been paid yet
  let currentSavingsRate = finalRequiredSavings; // Track current savings rate
  let savingsRateValidUntil = 0; // Track when current rate expires
  
  for (let month = 0; month < monthsToProject; month++) {
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + month, 1);
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    // Check for one-off payments this month
    const oneOffPaymentsThisMonth = remainingOneOffs.filter(oneOff => oneOff.paymentMonth === month);
    const oneOffExpensesThisMonth = oneOffPaymentsThisMonth.reduce((sum, payment) => sum + payment.expenseAmount, 0);
    const oneOffExpenseDescriptions = oneOffPaymentsThisMonth.map(p => p.description);
    
    // Check for regular expenses this month from pre-calculated schedule
    const regularExpenseThisMonth = allRegularExpenses.find(exp => exp.month === monthName);
    const regularExpensesThisMonth = regularExpenseThisMonth ? regularExpenseThisMonth.amount : 0;
    const regularExpenseDescriptions = regularExpenseThisMonth ? regularExpenseThisMonth.descriptions : [];
    
    // Combine all expenses
    const totalExpensesThisMonth = oneOffExpensesThisMonth + regularExpensesThisMonth;
    const allExpenseDescriptions = [...oneOffExpenseDescriptions, ...regularExpenseDescriptions];
    
    // Check if this is after a one-off payment (for adjustment calculation)
    const isAfterOneOffPayment = month > 0 && monthlyCalc[month - 1]?.hasSignificantExpense;
    
    // Only recalculate savings at 6-month intervals or after one-off payments
    const shouldRecalculate = isAfterOneOffPayment || (month > savingsRateValidUntil && month % 6 === 0);
    
    if (shouldRecalculate) {
      const remainingMonths = monthsToProject - month;
      
      // Calculate remaining regular expenses
      const remainingRegularExpenses = allRegularExpenses
        .filter(exp => {
          const expDate = new Date(exp.month + ' 1, ' + new Date().getFullYear());
          return expDate >= currentDate;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      // Calculate remaining one-off expenses
      const remainingOneOffExpenses = remainingOneOffs.reduce((sum, exp) => sum + exp.expenseAmount, 0);
      
      // Calculate what we need to save to reach target balance at the end
      // Formula: (Target Balance - Current Balance + Remaining Expenses) / Remaining Months
      const totalRemainingExpenses = remainingRegularExpenses + remainingOneOffExpenses;
      const savingsNeeded = target - balance + totalRemainingExpenses;
      const requiredMonthlySavings = savingsNeeded / remainingMonths;
      
      // Update the current savings rate and set it to be valid for the next 6 months
      currentSavingsRate = Math.max(requiredMonthlySavings, 100);
      savingsRateValidUntil = month + 6; // Valid for next 6 months
      
      if (isAfterOneOffPayment) {
        console.log(`Month ${month}: After one-off payment, recalculated monthly savings: ${currentSavingsRate.toFixed(2)} CHF (valid until month ${savingsRateValidUntil})`);
      } else {
        console.log(`Month ${month}: 6-month adjustment, recalculated monthly savings: ${currentSavingsRate.toFixed(2)} CHF (valid until month ${savingsRateValidUntil})`);
      }
      console.log(`  Remaining months: ${remainingMonths}`);
      console.log(`  Current balance: ${balance.toFixed(2)} CHF`);
      console.log(`  Target balance: ${target.toFixed(2)} CHF`);
      console.log(`  Remaining expenses: ${totalRemainingExpenses.toFixed(2)} CHF`);
      console.log(`  Savings needed: ${savingsNeeded.toFixed(2)} CHF`);
    } else if (remainingOneOffs.length === 0) {
      // All one-off payments are complete, only save for regular expenses
      const remainingRegularExpenses = allRegularExpenses
        .filter(exp => {
          const expDate = new Date(exp.month + ' 1, ' + new Date().getFullYear());
          return expDate >= currentDate;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      const remainingMonths = monthsToProject - month;
      const savingsNeeded = target - balance + remainingRegularExpenses;
      const requiredMonthlySavings = savingsNeeded / remainingMonths;
      
      currentSavingsRate = Math.max(requiredMonthlySavings, 100);
      savingsRateValidUntil = month + 6; // Valid for next 6 months
      
      console.log(`Month ${month}: All one-off payments complete, saving only for regular expenses: ${currentSavingsRate.toFixed(2)} CHF (valid until month ${savingsRateValidUntil})`);
    }
    
    // Calculate balances with current savings rate
    const startBalance = balance;
    balance += currentSavingsRate;
    balance -= totalExpensesThisMonth;
    
    // Remove paid one-offs from future calculations
    if (oneOffPaymentsThisMonth.length > 0) {
      remainingOneOffs = remainingOneOffs.filter(oneOff => oneOff.paymentMonth !== month);
      console.log(`Month ${month}: Paid ${oneOffPaymentsThisMonth.length} one-off(s), ${remainingOneOffs.length} remaining`);
    }
    
    const isOneOffPaymentMonth = oneOffPaymentsThisMonth.length > 0;
    const isRegularExpenseMonth = regularExpensesThisMonth > 0;
    const hasAnyExpenses = isOneOffPaymentMonth || isRegularExpenseMonth;
    const isAdjustmentMonth = isAfterOneOffPayment;
    
    // Determine if this is a smoothing adjustment (only after one-off payments)
    const isSmoothingAdjustment = isAfterOneOffPayment && Math.abs(currentSavingsRate - finalRequiredSavings) > 0.01;
    const smoothingAmount = currentSavingsRate - finalRequiredSavings;
    
    monthlyCalc.push({
      month: monthName,
      date: monthName,
      startBalance: startBalance,
      monthlySaving: currentSavingsRate,
      baselineSaving: finalRequiredSavings, // Show the original constant amount
      oneOffContribution: 0, // Not used in this approach
      expenses: allExpenseDescriptions,
      totalExpenses: totalExpensesThisMonth,
      endBalance: balance,
      remainingOneOffs: remainingOneOffs.length,
      isAdjustingToInitial: isAdjustmentMonth,
      hasSignificantExpense: isOneOffPaymentMonth,
      hasRegularExpense: isRegularExpenseMonth,
      hasAnyExpense: hasAnyExpenses,
      isInAdjustmentCycle: false,
      isReducedSavings: remainingOneOffs.length < oneOffExpenses.length,
      belowTargetBalance: balance < target,
      belowZero: balance < 0,
      monthIndex: month,
      isBaselineOnly: remainingOneOffs.length === 0,
      isIntegratedCalculation: true,
      isSmoothingAdjustment: isSmoothingAdjustment,
      smoothingAmount: smoothingAmount,
      accumulatedDeficit: 0, // Not used in this approach
      isEmergencyProtection: false, // Not used in this approach
      isAfterOneOffPayment: isAfterOneOffPayment,
      savingsRateValidUntil: savingsRateValidUntil
    });
    
    // Stop if balance goes negative (should not happen with proper calculation)
    if (balance < 0) {
      console.error(`Month ${month}: Balance went negative (${balance.toFixed(2)}), stopping projection`);
      break;
    }
  }
  
  const finalBalance = monthlyCalc[monthlyCalc.length - 1]?.endBalance || 0;
  console.log(`🎯 FORWARD-LOOKING CALCULATION COMPLETE!`);
  console.log(`Final balance: ${finalBalance.toFixed(2)} CHF`);
  console.log(`Constant monthly savings: ${finalRequiredSavings.toFixed(2)} CHF`);
  console.log(`Final monthly savings: ${monthlyCalc[monthlyCalc.length - 1]?.monthlySaving || 0} CHF`);
  
  return monthlyCalc;
}

// Utility function to get month name
function getMonthName(year, monthIndex) {
  const date = new Date(year, monthIndex, 1);
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

// Cache utilities (kept for compatibility)
const generateCacheKey = (expenses, currentAmount, targetAmount, adjustmentCycleYears) => {
  const expensesKey = JSON.stringify(expenses.map(exp => ({
    amount: exp.amount,
    recurrence: exp.recurrence,
    paymentSchedule: exp.paymentSchedule,
    endDate: exp.endDate,
    startDate: exp.startDate
  })));
  return `${expensesKey}_${currentAmount}_${targetAmount}_${adjustmentCycleYears}`;
}; 