// Test the balance calculation fix
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

console.log("=== TESTING BALANCE CALCULATION FIX ===");

// Test the specific case from the screenshot
const startingBalance = 3100.57;
const monthlySaving = 4157.89;
const expenses = 11000;

console.log("Manual calculation:");
console.log(`Start Balance: ${startingBalance}`);
console.log(`Monthly Saving: ${monthlySaving}`);
console.log(`Expenses: ${expenses}`);
console.log(`Expected End Balance: ${startingBalance + monthlySaving - expenses}`);
console.log(`Expected End Balance: ${(3100.57 + 4157.89) - 11000}`);

// Now test with the actual function
try {
  const results = getMonthlyCalculationDetails(testExpenses, startingBalance.toString(), '1000', '1');
  
  // Find January 2028
  const jan2028 = results.find(r => r.month.includes('Jan') && r.month.includes('2028'));
  
  if (jan2028) {
    console.log("\nFunction calculation for Jan 2028:");
    console.log(`Start Balance: ${jan2028.startBalance.toFixed(2)}`);
    console.log(`Monthly Saving: ${jan2028.monthlySaving.toFixed(2)}`);
    console.log(`Total Expenses: ${jan2028.totalExpenses.toFixed(2)}`);
    console.log(`End Balance: ${jan2028.endBalance.toFixed(2)}`);
    
    // Verify the calculation
    const expectedBalance = jan2028.startBalance + jan2028.monthlySaving - jan2028.totalExpenses;
    console.log(`Expected End Balance: ${expectedBalance.toFixed(2)}`);
    console.log(`Calculation matches: ${Math.abs(jan2028.endBalance - expectedBalance) < 0.01 ? 'YES' : 'NO'}`);
    
    if (Math.abs(jan2028.endBalance - expectedBalance) < 0.01) {
      console.log("✅ FIX SUCCESSFUL: Balance calculation is now correct!");
    } else {
      console.log("❌ FIX FAILED: Balance calculation is still incorrect");
    }
  } else {
    console.log("Could not find January 2028 in results");
  }
} catch (error) {
  console.error("Error running test:", error);
} 