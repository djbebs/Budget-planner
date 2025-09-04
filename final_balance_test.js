// Final test to demonstrate the balance calculation fix
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

console.log("=== FINAL BALANCE CALCULATION TEST ===");

// Test with a scenario that should result in negative balance
const startingBalance = 1000; // Low starting balance
const targetBalance = 1000;

console.log("Test scenario:");
console.log(`Starting Balance: CHF ${startingBalance.toFixed(2)}`);
console.log(`Target Balance: CHF ${targetBalance.toFixed(2)}`);
console.log(`One-off Expense: CHF 11000.00`);

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
    
    // Manual calculation
    const manualCalc = jan2028.startBalance + jan2028.monthlySaving - jan2028.totalExpenses;
    console.log(`Manual calculation: CHF ${manualCalc.toFixed(2)}`);
    
    if (jan2028.endBalance < 0) {
      console.log("\n✅ SUCCESS: The function now correctly shows negative balances!");
      console.log("The artificial constraint that prevented negative balances has been removed.");
      console.log("This allows users to see the true financial situation.");
    } else {
      console.log("\n❌ FAILED: The function is still artificially preventing negative balances.");
    }
    
    // Check if the calculation matches
    if (Math.abs(jan2028.endBalance - manualCalc) < 0.01) {
      console.log("✅ SUCCESS: The mathematical calculation is correct!");
    } else {
      console.log("❌ FAILED: The mathematical calculation is incorrect.");
    }
    
  } else {
    console.log("Could not find January 2028 in results");
  }
  
  // Show a few months to demonstrate the pattern
  console.log("\nFirst few months of the projection:");
  for (let i = 0; i < Math.min(3, results.length); i++) {
    const month = results[i];
    console.log(`${month.month}: Start=${month.startBalance.toFixed(2)}, Savings=${month.monthlySaving.toFixed(2)}, Expenses=${month.totalExpenses.toFixed(2)}, End=${month.endBalance.toFixed(2)}`);
  }
  
} catch (error) {
  console.error("Error running test:", error);
} 