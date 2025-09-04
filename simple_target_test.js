// Simple test for target balance optimization
const { getMonthlyCalculationDetails } = require('./src/utils.js');

console.log("=== SIMPLE TARGET BALANCE TEST ===");

const testExpenses = [
  {
    description: "Test Expense",
    amount: 1000,
    recurrence: "One-off",
    paymentSchedule: "01.02",
    startDate: "2026-01-01",
    endDate: "2030-12-31"
  }
];

const startingBalance = 5000;
const targetBalance = 500;

console.log(`Starting Balance: CHF ${startingBalance}`);
console.log(`Target Balance: CHF ${targetBalance}`);

try {
  console.log("Calling getMonthlyCalculationDetails...");
  const results = getMonthlyCalculationDetails(testExpenses, startingBalance.toString(), targetBalance.toString(), '1');
  
  console.log(`Results length: ${results.length}`);
  
  if (results.length > 0) {
    const firstMonth = results[0];
    const lastMonth = results[results.length - 1];
    
    console.log(`First month: ${firstMonth.month}, Savings: ${firstMonth.monthlySaving}, Balance: ${firstMonth.endBalance}`);
    console.log(`Last month: ${lastMonth.month}, Savings: ${lastMonth.monthlySaving}, Balance: ${lastMonth.endBalance}`);
    
    const maxBalance = Math.max(...results.map(r => r.endBalance));
    const overSavingRatio = maxBalance / targetBalance;
    
    console.log(`Max balance: ${maxBalance}`);
    console.log(`Over-saving ratio: ${overSavingRatio.toFixed(1)}x`);
  }
  
} catch (error) {
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
} 