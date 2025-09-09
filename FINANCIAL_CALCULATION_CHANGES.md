# Financial Calculation Changes

This document outlines the changes made to the financial calculation logic to address issues with monthly savings and balance management.

## Key Issues Fixed

### 1. Removed Emergency Savings Injection

**Problem:** The previous implementation artificially added money to maintain the target balance, using funds that don't actually exist in real-world scenarios.

**Solution:** Removed the emergency injection mechanism that was preventing the balance from falling below the target level. The calculation now accurately reflects real-world constraints where you can't add money that doesn't exist.

### 2. Improved Monthly Savings Calculation

**Problem:** The monthly savings amount was not enough to cover one-off expenses, leading to negative balances.

**Solution:** Enhanced the monthly savings calculation to ensure it's sufficient to cover all expenses, including large one-off expenses. The algorithm now:
- Calculates the minimum savings needed to cover the largest expenses within a reasonable timeframe
- Ensures that one-off expenses are properly accounted for in the savings rate
- Simulates the account over time to detect potential negative balances

### 3. Prioritized Preventing Negative Balances

**Problem:** The algorithm was primarily focused on maintaining the target balance rather than preventing negative balances.

**Solution:** Shifted the priority to keeping the balance positive throughout the projection. The binary search optimization now focuses on:
1. Keeping the balance above zero (primary priority)
2. Preventing excessive growth (secondary priority)

## Technical Implementation Details

### Monthly Savings Calculation

The monthly savings calculation now includes:

1. A more conservative approach to average monthly expenses:
   ```javascript
   const avgMonthlyExpense = Math.max(
     totalExpenses / monthsToProject,
     totalOneOffExpenses / Math.min(monthsToProject, 24) // At least cover one-offs in 2 years
   );
   ```

2. Finding the month with the highest expenses and ensuring we save enough to cover it:
   ```javascript
   let highestMonthlyExpense = 0;
   // ... calculation logic
   const oneOffSavingsNeeded = Math.max(
     totalOneOffExpenses / Math.min(monthsToProject, 24),
     highestMonthlyExpense / 6 // Cover highest month within 6 months of saving
   );
   ```

3. Setting minimum acceptable savings to ensure positive balances:
   ```javascript
   minAcceptableSavings = Math.max(baseMinimumSavings, avgMonthlyExpense, oneOffSavingsNeeded);
   ```

### Balance Simulation

The simulation now prioritizes maintaining a positive balance:

1. Changed the primary constraint from "below target" to "below zero":
   ```javascript
   // Check if we went below zero - this is the primary constraint
   if (balance < 0) {
     belowZero = true;
     break;
   }
   ```

2. More aggressive adjustment when the balance would go negative:
   ```javascript
   // Below zero, increase lower bound more aggressively
   minSavings = testSavings * 1.1; // Increase by 10% to find a solution faster
   ```

## Testing Results

The changes were tested with three different scenarios:
1. **Low Balance** (starting: CHF 2,222, target: CHF 1,000)
2. **Medium Balance** (starting: CHF 10,000, target: CHF 5,000)
3. **High Balance** (starting: CHF 30,000, target: CHF 10,000)

All scenarios now maintain positive balances throughout the projection, even with large one-off expenses like the CHF 22,000 driveway expense.
