// Test the fixed algorithm
import { getMonthlyCalculationDetails } from './src/utils.js';

const testExpenses = [
  {
    description: "School Fees",
    amount: 11000,
    recurrence: "One-off",
    paymentSchedule: "15.01",
    startDate: "2028-01-01",
    endDate: "2028-12-31"
  }
];

console.log("=== TESTING FIXED ALGORITHM ===");

// Test with the scenario from the screenshot
const startingBalance = 3100.57;
const targetBalance = 1000;

console.log("Test scenario:");
console.log(`Starting Balance: CHF ${startingBalance.toFixed(2)}`);
console.log(`Target Balance: CHF ${targetBalance.toFixed(2)}`);
console.log(`One-off Expense: CHF 11000.00 (January 2028)`);

try {
  const results = getMonthlyCalculationDetails(testExpenses, startingBalance.toString(), targetBalance.toString(), '1');
  
  // Find January 2028
  const jan2028 = results.find(r => r.month.includes('Jan') && r.month.includes('2028'));
  
  if (jan2028) {
    console.log("\nJanuary 2028 calculation:");
    console.log(`Start Balance: CHF ${jan2028.startBalance.toFixed(2)}`);
    console.log(`Monthly Saving: CHF ${jan2028.monthlySaving.toFixed(2)}`);
    console.log(`Total Expenses: CHF ${jan2028.totalExpenses.toFixed(2)}`);
    console.log(`End Balance: CHF ${jan2028.endBalance.toFixed(2)}`);
    
    // Check if the calculation is mathematically correct
    const expectedBalance = jan2028.startBalance + jan2028.monthlySaving - jan2028.totalExpenses;
    console.log(`Expected calculation: ${jan2028.startBalance} + ${jan2028.monthlySaving} - ${jan2028.totalExpenses} = ${expectedBalance.toFixed(2)}`);
    
    if (Math.abs(jan2028.endBalance - expectedBalance) < 0.01) {
      console.log("✅ Mathematical calculation is correct");
    } else {
      console.log("❌ Mathematical calculation is incorrect");
      console.log(`Difference: ${(jan2028.endBalance - expectedBalance).toFixed(2)}`);
    }
    
    // Check if the algorithm prevented going below target
    if (jan2028.endBalance >= targetBalance) {
      console.log("✅ Algorithm correctly prevented going below target balance");
    } else {
      console.log("❌ Algorithm failed to prevent going below target balance");
    }
    
    // Show the savings pattern
    console.log("\nSavings pattern analysis:");
    let currentSavingsRate = null;
    let periodStart = null;
    
    for (let i = 0; i < results.length; i++) {
      const month = results[i];
      if (month.monthlySaving !== currentSavingsRate) {
        if (currentSavingsRate !== null) {
          console.log(`Period ${periodStart} to ${results[i-1].month}: Monthly saving = ${currentSavingsRate.toFixed(2)}`);
        }
        currentSavingsRate = month.monthlySaving;
        periodStart = month.month;
      }
    }
    
    if (currentSavingsRate !== null) {
      console.log(`Period ${periodStart} to ${results[results.length-1].month}: Monthly saving = ${currentSavingsRate.toFixed(2)}`);
    }
    
    // Verify the algorithm calculated the correct rate
    const totalExpenses = 11000;
    const monthsToProject = results.length;
    const expectedMonthlySavings = Math.max(0, (totalExpenses + targetBalance - startingBalance) / monthsToProject);
    
    console.log(`\nExpected monthly savings rate: CHF ${expectedMonthlySavings.toFixed(2)}`);
    console.log(`Actual monthly savings rate: CHF ${jan2028.monthlySaving.toFixed(2)}`);
    
    if (Math.abs(jan2028.monthlySaving - expectedMonthlySavings) < 0.01) {
      console.log("✅ Algorithm calculated the correct monthly savings rate");
    } else {
      console.log("❌ Algorithm calculated incorrect monthly savings rate");
    }
    
  } else {
    console.log("Could not find January 2028 in results");
  }
  
} catch (error) {
  console.error("Error running test:", error);
} 