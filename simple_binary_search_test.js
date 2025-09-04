// Simple test for binary search algorithm
import { getMonthlyCalculationDetails } from './src/utils.js';

const simpleExpenses = [
  {
    description: "Large One-off Expense",
    amount: 25000,
    recurrence: "One-off",
    paymentSchedule: "15.06",
    startDate: "2026-06-01",
    endDate: "2026-06-30"
  }
];

console.log("=== SIMPLE BINARY SEARCH TEST ===");

const startingBalance = 20000;
const targetBalance = 3000;

console.log(`Starting Balance: CHF ${startingBalance}`);
console.log(`Target Balance: CHF ${targetBalance}`);
console.log(`One-off Expense: CHF 25,000 in June 2026`);

try {
  const results = getMonthlyCalculationDetails(simpleExpenses, startingBalance.toString(), targetBalance.toString(), '1');
  
  console.log("\n=== RESULTS ===");
  console.log(`Number of months calculated: ${results.length}`);
  
  // Check if any month goes below target
  let monthsBelowTarget = [];
  for (let i = 0; i < results.length; i++) {
    const month = results[i];
    if (month.endBalance < targetBalance) {
      monthsBelowTarget.push({
        month: month.month,
        endBalance: month.endBalance,
        monthlySaving: month.monthlySaving
      });
    }
  }
  
  if (monthsBelowTarget.length === 0) {
    console.log("✅ SUCCESS: No months go below target balance");
  } else {
    console.log(`❌ FAILED: ${monthsBelowTarget.length} months go below target balance:`);
    monthsBelowTarget.forEach(m => {
      console.log(`  ${m.month}: Balance = ${m.endBalance.toFixed(2)}, Savings = ${m.monthlySaving.toFixed(2)}`);
    });
  }
  
  // Show the monthly savings rate
  if (results.length > 0) {
    console.log(`\nMonthly Savings Rate: CHF ${results[1]?.monthlySaving?.toFixed(2) || 'N/A'}`);
  }
  
  // Show first few months for verification
  console.log("\n=== FIRST 10 MONTHS ===");
  for (let i = 0; i < Math.min(10, results.length); i++) {
    const month = results[i];
    console.log(`${month.month}: Start=${month.startBalance.toFixed(2)}, Savings=${month.monthlySaving.toFixed(2)}, Expenses=${month.totalExpenses.toFixed(2)}, End=${month.endBalance.toFixed(2)}`);
  }
  
} catch (error) {
  console.error("Error running test:", error);
} 