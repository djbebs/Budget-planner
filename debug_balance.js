// Debug the balance calculation
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

console.log("=== DEBUGGING BALANCE CALCULATION ===");

try {
  const results = getMonthlyCalculationDetails(testExpenses, '3100.57', '1000', '1');
  
  console.log(`Total results: ${results.length}`);
  
  // Show first few months to understand the pattern
  console.log("\nFirst 5 months:");
  for (let i = 0; i < Math.min(5, results.length); i++) {
    const month = results[i];
    console.log(`${month.month}: Start=${month.startBalance.toFixed(2)}, Savings=${month.monthlySaving.toFixed(2)}, Expenses=${month.totalExpenses.toFixed(2)}, End=${month.endBalance.toFixed(2)}`);
  }
  
  // Find January 2028 specifically
  const jan2028 = results.find(r => r.month.includes('Jan') && r.month.includes('2028'));
  
  if (jan2028) {
    console.log("\nJanuary 2028 details:");
    console.log(`Month: ${jan2028.month}`);
    console.log(`Start Balance: ${jan2028.startBalance.toFixed(2)}`);
    console.log(`Monthly Saving: ${jan2028.monthlySaving.toFixed(2)}`);
    console.log(`Total Expenses: ${jan2028.totalExpenses.toFixed(2)}`);
    console.log(`End Balance: ${jan2028.endBalance.toFixed(2)}`);
    
    // Manual calculation
    const manualCalc = jan2028.startBalance + jan2028.monthlySaving - jan2028.totalExpenses;
    console.log(`Manual calculation: ${manualCalc.toFixed(2)}`);
    console.log(`Difference: ${(jan2028.endBalance - manualCalc).toFixed(2)}`);
  } else {
    console.log("January 2028 not found. Available months:");
    results.slice(0, 10).forEach(r => console.log(`  ${r.month}`));
  }
  
} catch (error) {
  console.error("Error:", error);
} 