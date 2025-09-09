// Buffer Account Calculation - Completely Rewritten Implementation
// This implementation focuses on maintaining a buffer account above the target level
// while preventing excessive growth

/**
 * Process a one-off expense to determine its payment date and details
 */
function processOneOffExpense(expense, startDate) {
  // Default to current date if start date is invalid
  if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
    startDate = new Date();
  }

  // Validate the expense object
  if (!expense || typeof expense !== 'object') {
    return {
      amount: 0,
      description: 'Invalid expense',
      paymentDate: new Date(startDate.getFullYear() + 1, startDate.getMonth(), 1),
      monthsUntil: 12
    };
  }

  let paymentDate;
  
  // Determine payment date based on available information
  if (expense.oneOffDate) {
    // Use explicit one-off date if provided
    paymentDate = new Date(expense.oneOffDate);
  } else if (expense.paymentSchedule) {
    // Parse from payment schedule
    const dateParts = expense.paymentSchedule.split('.');
    
    // Handle both formats: DD.MM or DD.MM.YYYY
    let day = 1, month = 0, year;
    
    if (dateParts.length >= 2) {
      day = parseInt(dateParts[0]) || 1;
      month = parseInt(dateParts[1]) - 1; // Convert to 0-based month
    }
    
    if (dateParts.length >= 3) {
      year = parseInt(dateParts[2]);
    } else {
      // If year not provided, use current year or next year if the date has passed
      year = startDate.getFullYear();
      const tempDate = new Date(year, month, day);
      
      if (tempDate <= startDate) {
        year++; // Move to next year if the date has already passed this year
      }
    }
    
    paymentDate = new Date(year, month, day);
  } else {
    // Default to one year from start date
    paymentDate = new Date(startDate);
    paymentDate.setFullYear(startDate.getFullYear() + 1);
  }
  
  // Validate the calculated payment date
  if (!paymentDate || isNaN(paymentDate.getTime())) {
    paymentDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), 1);
  }
  
  // Calculate months until payment
  const monthsUntil = Math.max(1, Math.ceil(
    (paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
    (paymentDate.getMonth() - startDate.getMonth())
  ));
  
  const amount = parseFloat(expense.amount) || 0;
  
  return {
    amount,
    description: expense.description || 'One-off expense',
    paymentDate,
    monthsUntil
  };
}

/**
 * Calculate monthly expenses based on annual or irregular recurrence patterns
 */
function calculateMonthlyExpenses(expenses, startDate, endDate) {
  if (!Array.isArray(expenses) || !startDate || !endDate) {
    return [];
  }
  
  const regularExpenses = expenses.filter(exp => 
    exp && exp.recurrence && ['Annual', 'Irregular'].includes(exp.recurrence)
  );
  
  const monthlySchedule = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    let monthExpenses = 0;
    const monthExpenseDetails = [];
    
    // Check each regular expense to see if it's due this month
    regularExpenses.forEach(expense => {
      if (expense.recurrence === 'Annual' && expense.paymentSchedule) {
        // Format: DD.MM
        const [_, monthStr] = expense.paymentSchedule.split('.'); 
        const expenseMonth = parseInt(monthStr) - 1; // Convert to 0-based month
        
        if (expenseMonth === month) {
          const amount = parseFloat(expense.amount) || 0;
          monthExpenses += amount;
          monthExpenseDetails.push({
            description: expense.description || expense.category || 'Annual expense',
            amount
          });
        }
      } else if (expense.recurrence === 'Irregular' && expense.paymentSchedule) {
        // Format: DD.MM;DD.MM;DD.MM
        const paymentDates = expense.paymentSchedule.split(';');
        
        for (const dateStr of paymentDates) {
          const [_, monthStr] = dateStr.trim().split('.');
          const expenseMonth = parseInt(monthStr) - 1;
          
          if (expenseMonth === month) {
            // Divide the total by the number of occurrences per year
            const amount = (parseFloat(expense.amount) || 0) / paymentDates.length;
            monthExpenses += amount;
            monthExpenseDetails.push({
              description: expense.description || expense.category || 'Irregular expense',
              amount
            });
            break; // Only count once per month
          }
        }
      }
    });
    
    // Add to monthly schedule if there are expenses
    if (monthExpenses > 0) {
      monthlySchedule.push({
        month: monthName,
        date: new Date(year, month, 1),
        totalAmount: monthExpenses,
        expenses: monthExpenseDetails
      });
    }
    
    // Move to the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return monthlySchedule;
}

/**
 * Generate detailed monthly calculation data
 */
export function getMonthlyCalculationDetails(expenses, currentAmount, targetAmount, adjustmentCycleYears = 1) {
  // Validate inputs
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return [];
  }
  
  const validExpenses = expenses.filter(exp => exp && typeof exp === 'object' && exp.recurrence);
  if (validExpenses.length === 0) {
    return [];
  }
  
  // Parse amounts
  const startingBalance = parseFloat(currentAmount) || 0;
  const targetBalance = parseFloat(targetAmount) || Math.max(500, startingBalance * 0.1);
  
  // Set up planning period
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Start from next month
  const endDate = new Date(2030, 8, 30); // September 2030
  
  // Calculate total months in the planning period
  const monthsToProject = Math.max(1, Math.ceil(
    (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
    (endDate.getMonth() - startDate.getMonth())
  ));
  
  // Process regular expenses (Annual, Irregular)
  const regularExpensesSchedule = calculateMonthlyExpenses(validExpenses, startDate, endDate);
  
  // Process one-off expenses
  const oneOffExpenses = validExpenses
    .filter(exp => exp.recurrence === 'One-off')
    .map(exp => {
      const details = processOneOffExpense(exp, startDate);
      
      // Calculate the month index when this expense will occur
      const monthIndex = Math.max(0, Math.min(
        monthsToProject - 1,
        Math.ceil(
          (details.paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
          (details.paymentDate.getMonth() - startDate.getMonth())
        )
      ));
      
      return {
        ...details,
        monthIndex
      };
    });
  
  // Calculate the monthly savings using our main function
  // The calculated savings must be enough to cover all expenses
  const monthlySavings = calculateMonthlySavingsNeeded(
    validExpenses, 
    currentAmount, 
    targetAmount, 
    adjustmentCycleYears
  );
  
  // For very high starting balances compared to target, we should reduce savings
  // This helps prevent excessive accumulation
  let initialSavingsRate = monthlySavings;
  if (startingBalance > targetBalance * 5) {
    // Starting balance is already very high compared to target
    // Reduce savings to just maintenance levels
    const reductionFactor = Math.min(0.8, targetBalance / startingBalance);
    initialSavingsRate = Math.max(500, monthlySavings * reductionFactor);
  }
  
  // Create the month-by-month projection
  const monthlyDetails = [];
  let balance = startingBalance;
  
  // Verify that the calculated savings amount will maintain the target balance
  // If not, recalculate to ensure we always maintain at least the target balance
  let simulationBalance = startingBalance;
  let balanceGoesNegative = false;
  let balanceBelowTarget = false;
  let lowestBalance = startingBalance;
  
  // First simulation to verify our calculated savings amount
  for (let month = 0; month < monthsToProject; month++) {
    // Calculate current date for this month
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + month);
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    // Add monthly savings
    simulationBalance += initialSavingsRate;
    
    // Get regular expenses for this month
    const regularExpenseMonth = regularExpensesSchedule.find(m => m.month === monthName);
    const regularExpenseAmount = regularExpenseMonth ? regularExpenseMonth.totalAmount : 0;
    
    // Get one-off expenses for this month
    const oneOffPaymentsThisMonth = oneOffExpenses.filter(exp => exp.monthIndex === month);
    const oneOffExpenseAmount = oneOffPaymentsThisMonth.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Combine all expenses
    const totalExpensesThisMonth = regularExpenseAmount + oneOffExpenseAmount;
    
    // Subtract expenses from balance
    simulationBalance -= totalExpensesThisMonth;
    
    // Check if balance goes below target or negative
    if (simulationBalance < targetBalance) balanceBelowTarget = true;
    if (simulationBalance < 0) balanceGoesNegative = true;
    
    lowestBalance = Math.min(lowestBalance, simulationBalance);
  }
  
  // If balance goes below target or negative, adjust the savings amount
  let adjustedMonthlySavings = initialSavingsRate;
  
  if (balanceBelowTarget || balanceGoesNegative) {
    // Calculate how much additional savings we need
    const deficit = Math.max(0, targetBalance - lowestBalance);
    const additionalPerMonth = deficit / monthsToProject;
    
    // Add a 20% safety margin
    adjustedMonthlySavings = initialSavingsRate + additionalPerMonth * 1.2;
  }
  
  // Now create the real month-by-month projection using the adjusted savings if needed
  let baselineSavingsAmount = balanceBelowTarget || balanceGoesNegative ? 
    adjustedMonthlySavings : initialSavingsRate;
  
  // Create an array to store the savings rate for each month
  // This allows for dynamic adjustments before and after one-off expenses
  const monthlySavingsRates = Array(monthsToProject).fill(baselineSavingsAmount);
  
  // Always adjust savings dynamically
  // First, identify all one-off expenses and when they occur
  const oneOffMonths = [];
  for (let month = 0; month < monthsToProject; month++) {
    const oneOffsThisMonth = oneOffExpenses.filter(exp => exp.monthIndex === month);
    
    if (oneOffsThisMonth.length > 0) {
      oneOffMonths.push({
        month,
        totalAmount: oneOffsThisMonth.reduce((sum, exp) => sum + exp.amount, 0),
        expenses: oneOffsThisMonth
      });
    }
  }
  
  // For each one-off expense month, adjust the PREVIOUS months' savings to ensure enough funds
  for (const oneOffMonth of oneOffMonths) {
    const month = oneOffMonth.month;
    const amount = oneOffMonth.totalAmount;
    
    // Skip if this is the first month (can't adjust previous months)
    if (month <= 0) continue;
    
    // For large expenses like a driveway, use more preparatory months
    // The bigger the expense, the more months we need to prepare
    const isLargeExpense = amount > 15000;
    
    // Use all available months for very large expenses, or a scaled amount for smaller ones
    let preparationMonths;
    if (isLargeExpense) {
      preparationMonths = month; // Use ALL previous months for large expenses
    } else {
      preparationMonths = Math.min(month, Math.max(3, Math.ceil(amount / 3000)));
    }
    
    // Calculate how much additional monthly savings is needed
    // Simulate to check if current savings rate is already sufficient
    let tempBalance = startingBalance;
    for (let i = 0; i < month; i++) {
      // Add monthly savings at current rate
      tempBalance += monthlySavingsRates[i];
      
      // Subtract regular expenses
      const tempDate = new Date(startDate);
      tempDate.setMonth(startDate.getMonth() + i);
      const tempMonthName = tempDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const tempRegularExpense = regularExpensesSchedule.find(m => m.month === tempMonthName);
      const tempRegularAmount = tempRegularExpense ? tempRegularExpense.totalAmount : 0;
      
      // Subtract any one-off expenses in this month
      const tempOneOffs = oneOffExpenses.filter(exp => exp.monthIndex === i);
      const tempOneOffAmount = tempOneOffs.reduce((sum, exp) => sum + exp.amount, 0);
      
      tempBalance -= tempRegularAmount + tempOneOffAmount;
    }
    
    // For large expenses, ensure we have enough to cover it plus a safety margin
    // For smaller expenses, just make sure we keep the target balance
    const safetyMargin = isLargeExpense ? targetBalance * 1.5 : targetBalance;
    const minimumNeededBalance = amount + safetyMargin;
    
    // If our projected balance isn't enough, increase savings in previous months
    if (tempBalance < minimumNeededBalance) {
      const additionalNeeded = minimumNeededBalance - tempBalance;
      
      // Add a safety buffer for very large expenses (20% extra)
      const safetyBuffer = isLargeExpense ? 1.2 : 1.05;
      const additionalPerMonth = (additionalNeeded * safetyBuffer) / preparationMonths;
      
      // Increase savings in the months leading up to the expense
      // Apply a gradual increase - save more as we get closer to the expense
      for (let j = month - preparationMonths; j < month; j++) {
        if (j >= 0) {
          // For large expenses, apply slightly more aggressive saving as we get closer
          const distanceFromExpense = month - j;
          const urgencyFactor = isLargeExpense ? 
            1 + (0.2 * (1 - distanceFromExpense / preparationMonths)) : 1;
          
          monthlySavingsRates[j] += additionalPerMonth * urgencyFactor;
        }
      }
    }
  }
  
  // Now adjust AFTER one-off payments to reduce savings if appropriate
  for (const oneOffMonth of oneOffMonths) {
    const month = oneOffMonth.month;
    
    // Skip if this is the last month
    if (month >= monthsToProject - 1) continue;
    
    // Get the current balance after the one-off expense
    let tempBalance = startingBalance;
    for (let i = 0; i <= month; i++) {
      // Add monthly savings
      tempBalance += monthlySavingsRates[i];
      
      // Subtract expenses for this month
      const tempDate = new Date(startDate);
      tempDate.setMonth(startDate.getMonth() + i);
      const tempMonthName = tempDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const tempRegularExpense = regularExpensesSchedule.find(m => m.month === tempMonthName);
      const tempRegularAmount = tempRegularExpense ? tempRegularExpense.totalAmount : 0;
      
      const tempOneOffs = oneOffExpenses.filter(exp => exp.monthIndex === i);
      const tempOneOffAmount = tempOneOffs.reduce((sum, exp) => sum + exp.amount, 0);
      
      tempBalance -= tempRegularAmount + tempOneOffAmount;
    }
    
    // Calculate new savings rate based on remaining expenses and target
    const remainingMonths = monthsToProject - month - 1;
    
    // Find remaining expenses (both one-offs and regular)
    const remainingOneOffs = oneOffExpenses
      .filter(exp => exp.monthIndex > month)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const remainingRegularExpenses = regularExpensesSchedule
      .filter(exp => {
        const expDate = new Date(exp.month);
        const monthIndex = Math.ceil(
          (expDate.getFullYear() - startDate.getFullYear()) * 12 + 
          (expDate.getMonth() - startDate.getMonth())
        );
        return monthIndex > month;
      })
      .reduce((sum, exp) => sum + exp.totalAmount, 0);
    
    // Calculate new savings to ensure we maintain the target balance
    // but don't accumulate unnecessarily
    const deficitFromTarget = Math.max(0, targetBalance - tempBalance);
    const totalRemainingExpenses = remainingOneOffs + remainingRegularExpenses;
    
    // Check for large expenses coming up in the next 12 months
    const largeExpensesComingSoon = oneOffExpenses
      .filter(exp => exp.monthIndex > month && exp.monthIndex <= month + 12 && exp.amount >= 10000)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Find the biggest regular monthly expense coming up
    let biggestUpcomingMonthlyExpense = 0;
    for (let i = month + 1; i < Math.min(monthsToProject, month + 12); i++) {
      const futureDate = new Date(startDate);
      futureDate.setMonth(startDate.getMonth() + i);
      const futureMonthName = futureDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const regExp = regularExpensesSchedule.find(m => m.month === futureMonthName);
      if (regExp && regExp.totalAmount > biggestUpcomingMonthlyExpense) {
        biggestUpcomingMonthlyExpense = regExp.totalAmount;
      }
    }
    
    // If there are large expenses coming up soon, we need to maintain higher savings
    let additionalSavingsNeeded = 0;
    if (largeExpensesComingSoon > 0) {
      // Need to start saving for the next big expense
      additionalSavingsNeeded = largeExpensesComingSoon / 12; // Spread over max 12 months
    }
    
    // New monthly savings rate after one-off
    // This ensures we build back up to the target plus cover remaining expenses
    const newRate = Math.max(
      // Basic rate to cover remaining expenses and maintain target
      (deficitFromTarget + totalRemainingExpenses) / remainingMonths,
      // Rate needed to cover upcoming large expenses
      additionalSavingsNeeded,
      // Rate needed to handle the biggest monthly expense
      biggestUpcomingMonthlyExpense / 3 // Save enough to cover biggest expense in 3 months
    );
    
    // Adjust based on current balance
    let finalRate = newRate;
    // If balance is very low, increase rate
    if (tempBalance < targetBalance * 0.5) {
      finalRate = newRate * 1.3; // 30% increase if balance is low
    }
    // If balance is already above target, can use standard rate
    
    // Don't reduce it below a reasonable minimum based on expenses
    const minRate = Math.max(
      baselineSavingsAmount * 0.5, 
      biggestUpcomingMonthlyExpense / 4
    );
    
    // Don't increase it beyond what's necessary
    const maxRate = baselineSavingsAmount * 1.5;
    const adjustedRate = Math.min(maxRate, Math.max(finalRate, minRate));
    
    // Apply to all remaining months
    for (let j = month + 1; j < monthsToProject; j++) {
      monthlySavingsRates[j] = adjustedRate;
    }
  }
  
  // Reset balance for actual projection
  balance = startingBalance;
  let prevSavingsRate = 0; // Track previous month's savings rate
  let savingsAdjusted = false; // Track if savings were adjusted
  
  for (let month = 0; month < monthsToProject; month++) {
    // Calculate current date for this month
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + month);
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    // Track starting balance for this month
    const startBalance = balance;
    
    // Get the savings amount for this month
    const finalSavingsAmount = monthlySavingsRates[month];
    
    // Add monthly savings
    balance += finalSavingsAmount;
    
    // Get regular expenses for this month
    const regularExpenseMonth = regularExpensesSchedule.find(
      m => m.month === monthName
    );
    
    const regularExpenseAmount = regularExpenseMonth ? regularExpenseMonth.totalAmount : 0;
    const regularExpenseDescriptions = regularExpenseMonth 
      ? regularExpenseMonth.expenses.map(e => e.description)
      : [];
    
    // Get one-off expenses for this month
    const oneOffPaymentsThisMonth = oneOffExpenses.filter(exp => exp.monthIndex === month);
    const oneOffExpenseAmount = oneOffPaymentsThisMonth.reduce((sum, exp) => sum + exp.amount, 0);
    const oneOffExpenseDescriptions = oneOffPaymentsThisMonth.map(exp => exp.description);
    
    // Combine all expenses
    const totalExpensesThisMonth = regularExpenseAmount + oneOffExpenseAmount;
    const allExpenseDescriptions = [...regularExpenseDescriptions, ...oneOffExpenseDescriptions];
    
    // Subtract expenses from balance
    balance -= totalExpensesThisMonth;
    
    // Remove emergency injection - allow balance to go below target
    // This reflects real-world constraints where we can't add money that doesn't exist
    let emergencyInjection = 0;
    
    // We don't artificially add money to maintain the target
    // balance remains as calculated (can go below target)
    
    // Determine if savings were adjusted this month
    const isSavingsAdjustmentMonth = month > 0 && prevSavingsRate !== finalSavingsAmount;
    
    // For the first month, set the previous month's savings rate
    if (month === 0) {
      prevSavingsRate = finalSavingsAmount;
    }
    
    // Track if this is a month after a one-off payment
    const isAfterOneOffMonth = month > 0 && 
      monthlyDetails.length > 0 && 
      monthlyDetails[monthlyDetails.length - 1].hasOneOffExpense;
    
    // Create the monthly record with visual indicators for the legend
    monthlyDetails.push({
      month: monthName,
      date: monthName,
      startBalance: startBalance,
      monthlySaving: finalSavingsAmount,
      emergencyInjection: emergencyInjection,
      expenses: allExpenseDescriptions,
      totalExpenses: totalExpensesThisMonth,
      endBalance: balance,
      belowTargetBalance: balance < targetBalance,
      belowZero: balance < 0,
      monthIndex: month,
      // Legend indicators
      hasOneOffExpense: oneOffPaymentsThisMonth.length > 0,
      hasRegularExpense: regularExpenseAmount > 0,
      isEmergencyProtection: emergencyInjection > 0,
      isSavingsAdjustment: isSavingsAdjustmentMonth,
      isAfterOneOffPayment: isAfterOneOffMonth,
      isIncreasedSavings: isSavingsAdjustmentMonth && finalSavingsAmount > prevSavingsRate,
      isDecreasedSavings: isSavingsAdjustmentMonth && finalSavingsAmount < prevSavingsRate,
      isSavingsAdjustedAfterOneOff: isSavingsAdjustmentMonth && isAfterOneOffMonth,
      isExtraSavings: emergencyInjection > 0,
      // Visual styling classes
      rowClass: oneOffPaymentsThisMonth.length > 0 ? 'one-off-expense' : 
                regularExpenseAmount > 0 ? 'regular-expense' : 
                isSavingsAdjustmentMonth ? 'savings-adjustment' : '',
      balanceWarning: balance < targetBalance * 1.2
    });
    
    // Update the previous savings rate for the next iteration
    prevSavingsRate = finalSavingsAmount;
  }
  
  return monthlyDetails;
}

/**
 * Main function: Calculate monthly savings needed
 */
export function calculateMonthlySavingsNeeded(expenses, currentAmount, targetAmount, adjustmentCycleYears = 1) {
  // Validate inputs
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return 0;
  }
  
  const validExpenses = expenses.filter(exp => exp && typeof exp === 'object' && exp.recurrence);
  if (validExpenses.length === 0) {
    return 0;
  }
  
  // Parse amounts
  const startingBalance = parseFloat(currentAmount) || 0;
  const targetBalance = parseFloat(targetAmount) || 0;
  
  // Set up planning period
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Start from next month
  const endDate = new Date(2030, 8, 30); // September 2030
  
  // Calculate total months in the planning period
  const monthsToProject = Math.max(1, Math.ceil(
    (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
    (endDate.getMonth() - startDate.getMonth())
  ));
  
  // Process regular expenses (Annual, Irregular)
  const regularExpensesSchedule = calculateMonthlyExpenses(validExpenses, startDate, endDate);
  const totalRegularExpenses = regularExpensesSchedule.reduce((sum, month) => sum + month.totalAmount, 0);
  
  // Process one-off expenses
  const oneOffExpenses = validExpenses
    .filter(exp => exp.recurrence === 'One-off')
    .map(exp => {
      const details = processOneOffExpense(exp, startDate);
      
      // Calculate the month index when this expense will occur
      const monthIndex = Math.max(0, Math.min(
        monthsToProject - 1,
        Math.ceil(
          (details.paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
          (details.paymentDate.getMonth() - startDate.getMonth())
        )
      ));
      
      return {
        ...details,
        monthIndex
      };
    });
  
  const totalOneOffExpenses = oneOffExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Check if we have the driveway or other major expense (over 25K)
  const majorExpenses = oneOffExpenses.filter(exp => exp.amount > 25000);
  const hasDrivewayExpense = majorExpenses.length > 0;
  
  // BUFFER ACCOUNT CALCULATION APPROACH
  // Find the optimal monthly savings that maintains the buffer at target balance
  
  // Base savings calculation approaches
  const baseMinimumSavings = 1000; // Minimum sensible amount for a buffer account
  
  // Special handling for the driveway expense or other major expenses
  if (hasDrivewayExpense) {
    const majorExpense = majorExpenses[0]; // Use the first major expense (typically driveway)
    const monthsUntilExpense = Math.max(1, majorExpense.monthIndex);
    
    // For major expenses like the driveway, we need:
    // 1. Enough to cover the expense
    // 2. Plus maintain the target balance afterward
    // 3. Account for regular expenses during the saving period
    
    // Calculate regular expenses until the major expense
    let regularExpensesBeforeMajor = 0;
    for (const monthExp of regularExpensesSchedule) {
      const monthIndex = Math.ceil(
        (monthExp.date.getFullYear() - startDate.getFullYear()) * 12 + 
        (monthExp.date.getMonth() - startDate.getMonth())
      );
      
      if (monthIndex <= monthsUntilExpense) {
        regularExpensesBeforeMajor += monthExp.totalAmount;
      }
    }
    
    // Determine if we have enough already to cover the expense
    let monthlySavings;
    
    if (startingBalance >= (majorExpense.amount + targetBalance + regularExpensesBeforeMajor)) {
      // We already have enough to cover the expense and maintain the target
      // Just save a moderate amount
      monthlySavings = Math.max(1000, (regularExpensesBeforeMajor / monthsUntilExpense) * 1.2);
    } else {
      // Account for all expenses plus maintaining the target balance
      const totalNeeded = majorExpense.amount + targetBalance + regularExpensesBeforeMajor;
      const additionalNeeded = Math.max(0, totalNeeded - startingBalance);
      
      // Calculate the monthly savings needed
      monthlySavings = additionalNeeded / monthsUntilExpense;
    }
    
    // Apply a reasonable minimum and maximum for major expenses
    return Math.ceil(Math.min(Math.max(monthlySavings, 5000), 10000));
  }
  
  // For regular buffer account without major expenses:
  // Simulate the account over time to ensure target balance is maintained
  
  // Calculate the total expenses and find an appropriate savings rate
  const totalExpenses = totalRegularExpenses + totalOneOffExpenses;
  
  // Instead of simple average, calculate to ensure we have enough for the largest expenses
  // This is a more conservative approach that prevents balance from going negative
  const avgMonthlyExpense = Math.max(
    totalExpenses / monthsToProject,
    totalOneOffExpenses / Math.min(monthsToProject, 24) // At least cover one-offs in 2 years
  );
  
  // Find largest expenses and their timing for more accurate planning
  let largestExpenseNext24Months = 0;
  let largestExpenseMonth = 0;
  let totalExpensesNext24Months = 0;
  let expenseTimeline = [];
  
  // Analyze the expense pattern over time
  for (let month = 0; month < Math.min(monthsToProject, 24); month++) {
    // Calculate date for this month
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + month);
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    // Get regular expenses for this month
    const regularExpense = regularExpensesSchedule.find(m => m.month === monthName);
    const regularAmount = regularExpense ? regularExpense.totalAmount : 0;
    
    // Get one-off expenses for this month
    const oneOffPayments = oneOffExpenses.filter(exp => exp.monthIndex === month);
    const oneOffAmount = oneOffPayments.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Combined total for this month
    const totalMonthlyExpense = regularAmount + oneOffAmount;
    totalExpensesNext24Months += totalMonthlyExpense;
    
    // Track this month's expenses
    expenseTimeline.push({
      month,
      amount: totalMonthlyExpense,
      hasOneOff: oneOffAmount > 0
    });
    
    // Update the largest expense if needed
    if (totalMonthlyExpense > largestExpenseNext24Months) {
      largestExpenseNext24Months = totalMonthlyExpense;
      largestExpenseMonth = month;
    }
  }
  
  // Calculate how much lead time we need for the largest expense
  // Larger expenses need more lead time
  const leadTimeMonths = Math.max(3, Math.min(12, Math.ceil(largestExpenseNext24Months / 5000)));
  
  // Calculate how long to spread out the saving for this expense
  const effectiveSavingMonths = Math.max(1, largestExpenseMonth);
  
  // Initial calculation approach with enhanced expense timing consideration
  const balanceGap = Math.max(0, targetBalance - startingBalance);
  const largestExpenseSavings = largestExpenseNext24Months / Math.min(leadTimeMonths, effectiveSavingMonths);
  const targetGapSavings = balanceGap / 6; // Reach target within 6 months
  const avgExpenseSavings = avgMonthlyExpense * 1.2; // 20% buffer over average expenses
  
  // Initial savings estimate
  let initialSavings = Math.max(
    avgExpenseSavings,
    largestExpenseSavings,
    targetGapSavings,
    baseMinimumSavings
  );
  
  // Binary search to find the optimal savings amount that:
  // 1. Keeps balance above zero (primary priority)
  // 2. Prevents excessive growth
  let minSavings = Math.max(baseMinimumSavings, avgMonthlyExpense * 0.8); // Minimum is at least 80% of average expenses
  let maxSavings = initialSavings * 2; // More room to ensure we cover one-offs
  let optimalSavings = initialSavings;
  let bestDifference = Number.MAX_VALUE;
  // Limit max growth based on target balance - for small targets, limit more aggressively
  const growthFactor = targetBalance < 1000 ? 2 : (targetBalance < 5000 ? 3 : 4);
  const maxAcceptableBalance = targetBalance * growthFactor;
  
  // Use binary search to find the optimal savings amount
  for (let i = 0; i < 10; i++) { // 10 iterations should be sufficient
    const testSavings = (minSavings + maxSavings) / 2;
    
    // Simulate the account with this savings amount
    let minBalance = startingBalance;
    let maxBalance = startingBalance;
    let balance = startingBalance;
    let belowZero = false;
    
    for (let month = 0; month < monthsToProject; month++) {
      // Add monthly savings
      balance += testSavings;
      
      // Calculate current date for this month
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + month);
      const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      // Check for regular expenses this month
      const regularExpenseMonth = regularExpensesSchedule.find(m => m.month === monthName);
      const regularExpenseAmount = regularExpenseMonth ? regularExpenseMonth.totalAmount : 0;
      
      // Check for one-off expenses this month
      const oneOffPaymentsThisMonth = oneOffExpenses.filter(exp => exp.monthIndex === month);
      const oneOffExpenseAmount = oneOffPaymentsThisMonth.reduce((sum, exp) => sum + exp.amount, 0);
      
      // Subtract expenses
      balance -= regularExpenseAmount;
      balance -= oneOffExpenseAmount;
      
      // Track min and max
      minBalance = Math.min(minBalance, balance);
      maxBalance = Math.max(maxBalance, balance);
      
      // Check if we went below zero - this is the primary constraint
      if (balance < 0) {
        belowZero = true;
        break;
      }
    }
    
    // Check if this is valid and better than previous
    if (!belowZero) {
      const finalBalance = balance;
      const difference = Math.abs(finalBalance - targetBalance);
      
      if (difference < bestDifference) {
        bestDifference = difference;
        optimalSavings = testSavings;
      }
      
      // Adjust bounds based on final balance
      if (finalBalance > maxAcceptableBalance) {
        // Too high, reduce upper bound
        maxSavings = testSavings;
      } else {
        // Good result, but try going lower
        minSavings = testSavings * 0.9;
        maxSavings = testSavings;
      }
    } else {
      // Below zero, increase lower bound more aggressively
      minSavings = testSavings * 1.1; // Increase by 10% to find a solution faster
    }
  }
  
  // Apply reasonable bounds based on different situations
  let minAcceptableSavings;
  let maxAcceptableSavings;
  
  // Calculate the minimum monthly savings needed to cover one-off expenses
  // This is to ensure we always save enough to cover one-off expenses
  // Find the month with the highest expenses (either one-off or regular)
  let highestMonthlyExpense = 0;
  
  // Check all months for the highest combined expense
  let simulationBalance = startingBalance;
  for (let month = 0; month < monthsToProject; month++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + month);
    const monthName = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    // Regular expenses this month
    const regularExpenseMonth = regularExpensesSchedule.find(m => m.month === monthName);
    const regularExpenseAmount = regularExpenseMonth ? regularExpenseMonth.totalAmount : 0;
    
    // One-off expenses this month
    const oneOffPaymentsThisMonth = oneOffExpenses.filter(exp => exp.monthIndex === month);
    const oneOffExpenseAmount = oneOffPaymentsThisMonth.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate total monthly expense
    const totalMonthlyExpense = regularExpenseAmount + oneOffExpenseAmount;
    highestMonthlyExpense = Math.max(highestMonthlyExpense, totalMonthlyExpense);
    
    // Check if this would make the balance negative
    if ((simulationBalance - totalMonthlyExpense) < 0) {
      // This month would make the balance negative - we need more savings
      const deficitThisMonth = totalMonthlyExpense - simulationBalance;
      highestMonthlyExpense = Math.max(highestMonthlyExpense, deficitThisMonth / month);
    }
    
    // Update simulation balance assuming a baseline savings rate
    simulationBalance = Math.max(0, simulationBalance - totalMonthlyExpense) + avgMonthlyExpense;
  }
  
  // Set minimum needed to cover the highest expense month
  const oneOffSavingsNeeded = Math.max(
    totalOneOffExpenses / Math.min(monthsToProject, 24), // Base calculation - cover one-offs in 2 years
    highestMonthlyExpense / 6 // Cover highest month within 6 months of saving
  );
  
  // Handle extremely low target balance
  if (targetBalance < 500) {
    // For very low targets, savings should still be enough to cover expenses
    minAcceptableSavings = Math.max(baseMinimumSavings, oneOffSavingsNeeded, avgMonthlyExpense * 0.8);
    maxAcceptableSavings = Math.max(5000, oneOffSavingsNeeded * 1.2); // Ensure we can cover one-offs
  } else {
    // Normal case
    minAcceptableSavings = Math.max(baseMinimumSavings, avgMonthlyExpense, oneOffSavingsNeeded);
    maxAcceptableSavings = Math.max(8000, oneOffSavingsNeeded * 1.5); // Ensure we can cover large one-offs
  }
  
  // Even for high starting balances, ensure we maintain enough to cover expenses
  // We only reduce minimum savings if we have enough to cover ALL expected expenses
  const totalAllExpenses = totalRegularExpenses + totalOneOffExpenses;
  if (startingBalance > targetBalance * 5 && startingBalance > totalAllExpenses) {
    // If starting balance can cover ALL expenses entirely, we can reduce savings
    minAcceptableSavings = Math.min(minAcceptableSavings, avgMonthlyExpense * 0.8);
  } else {
    // Otherwise ensure we have at least enough to cover the largest expenses
    minAcceptableSavings = Math.max(minAcceptableSavings, highestMonthlyExpense / 12);
  }
  
  // Final calculation - prioritize ensuring we have enough for one-off expenses
  const finalSavings = Math.ceil(Math.min(Math.max(optimalSavings, minAcceptableSavings, oneOffSavingsNeeded), maxAcceptableSavings));
  return finalSavings;
}