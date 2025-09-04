// Test that forces a negative balance scenario
import { getMonthlyCalculationDetails } from './src/utils.js';

const testExpenses = [
  {
    description: "Large One-off Expense",
    amount: 50000, // Very large expense
    recurrence: "One-off",
    paymentSchedule: "15.01",
    startDate: "2026-01-01",
    endDate: "2026-12-31"
  }
];

console.log("=== FORCING NEGATIVE BALANCE TEST ===");

// Test with a very low starting balance and very large expense
const startingBalance = 1000; // Very low starting balance
const targetBalance = 1000;

console.log("Test scenario:");
console.log(`Starting Balance: CHF ${startingBalance.toFixed(2)}`);
console.log(`Target Balance: CHF ${targetBalance.toFixed(2)}`);
console.log(`One-off Expense: CHF 50000.00`);

try {
  const results = getMonthlyCalculationDetails(testExpenses, startingBalance.toString(), targetBalance.toString(), '1');
  
  // Find January 2026 (when the large expense occurs)
  const jan2026 = results.find(r => r.month.includes('Jan') && r.month.includes('2026'));
  
  if (jan2026) {
    console.log("\nJanuary 2026 calculation:");
    console.log(`Start Balance: CHF ${jan2026.startBalance.toFixed(2)}`);
    console.log(`Monthly Saving: CHF ${jan2026.monthlySaving.toFixed(2)}`);
    console.log(`Total Expenses: CHF ${jan2026.totalExpenses.toFixed(2)}`);
    console.log(`End Balance: CHF ${jan2026.endBalance.toFixed(2)}`);
    
    // Manual calculation
    const manualCalc = jan2026.startBalance + jan2026.monthlySaving - jan2026.totalExpenses;
    console.log(`Manual calculation: CHF ${manualCalc.toFixed(2)}`);
    
    if (jan2026.endBalance < 0) {
      console.log("\n✅ SUCCESS: The function now correctly shows negative balances!");
      console.log("The artificial constraint that prevented negative balances has been removed.");
    } else {
      console.log("\n❌ FAILED: The function is still artificially preventing negative balances.");
      console.log("This suggests there might be another constraint somewhere.");
    }
    
    // Check if the calculation matches
    if (Math.abs(jan2026.endBalance - manualCalc) < 0.01) {
      console.log("✅ SUCCESS: The mathematical calculation is correct!");
    } else {
      console.log("❌ FAILED: The mathematical calculation is incorrect.");
      console.log(`Difference: ${(jan2026.endBalance - manualCalc).toFixed(2)}`);
    }
    
  } else {
    console.log("Could not find January 2026 in results");
    console.log("Available months:");
    results.slice(0, 10).forEach(r => console.log(`  ${r.month}`));
  }
  
} catch (error) {
  console.error("Error running test:", error);
} 