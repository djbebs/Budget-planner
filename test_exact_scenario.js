// Test the exact scenario from the screenshot
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

console.log("=== TESTING EXACT SCENARIO FROM SCREENSHOT ===");

// The exact values from the screenshot tooltip
const startBalance = 3100.57;
const monthlySaving = 4157.89;
const totalExpenses = 11000.00;

console.log("Screenshot tooltip values:");
console.log(`Start Balance: CHF ${startBalance.toFixed(2)}`);
console.log(`Monthly Saving: CHF ${monthlySaving.toFixed(2)}`);
console.log(`Total Expenses: CHF ${totalExpenses.toFixed(2)}`);

// Manual calculation
const expectedEndBalance = startBalance + monthlySaving - totalExpenses;
console.log(`Expected End Balance: CHF ${expectedEndBalance.toFixed(2)}`);
console.log(`This should be: CHF ${(3100.57 + 4157.89 - 11000).toFixed(2)}`);

console.log("\nThe screenshot showed End Balance: CHF 1'000.00");
console.log("This was mathematically incorrect!");
console.log(`The correct End Balance should be: CHF ${expectedEndBalance.toFixed(2)}`);

// Test with the function to ensure it now shows the correct calculation
try {
  const results = getMonthlyCalculationDetails(testExpenses, startBalance.toString(), '1000', '1');
  
  // Find January 2028
  const jan2028 = results.find(r => r.month.includes('Jan') && r.month.includes('2028'));
  
  if (jan2028) {
    console.log("\nFunction calculation for Jan 2028:");
    console.log(`Start Balance: CHF ${jan2028.startBalance.toFixed(2)}`);
    console.log(`Monthly Saving: CHF ${jan2028.monthlySaving.toFixed(2)}`);
    console.log(`Total Expenses: CHF ${jan2028.totalExpenses.toFixed(2)}`);
    console.log(`End Balance: CHF ${jan2028.endBalance.toFixed(2)}`);
    
    // Check if the function now shows the correct negative balance
    if (jan2028.endBalance < 0) {
      console.log("✅ FIX SUCCESSFUL: Function now shows negative balance instead of artificially setting it to 1000!");
      console.log(`The balance is now correctly showing: CHF ${jan2028.endBalance.toFixed(2)}`);
    } else {
      console.log("❌ FIX FAILED: Function is still showing incorrect positive balance");
    }
  } else {
    console.log("Could not find January 2028 in results");
  }
} catch (error) {
  console.error("Error running test:", error);
} 