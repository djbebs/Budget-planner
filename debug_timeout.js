// Debug script with timeout detection
console.log("Starting timeout debug test...");

const { getMonthlyCalculationDetails } = require('./src/utils.js');

// Set a timeout to detect infinite loops
const TIMEOUT_MS = 10000; // 10 seconds
let timeoutId;

function startTimeout() {
  timeoutId = setTimeout(() => {
    console.error("❌ TIMEOUT: Algorithm took longer than 10 seconds - likely infinite loop!");
    process.exit(1);
  }, TIMEOUT_MS);
}

function clearTimeoutCheck() {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

try {
  console.log("Setting 10-second timeout...");
  startTimeout();
  
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

  console.log("Calling getMonthlyCalculationDetails...");
  console.log("Parameters:", { startingBalance, targetBalance, expensesCount: testExpenses.length });
  
  const results = getMonthlyCalculationDetails(
    testExpenses, 
    startingBalance.toString(), 
    targetBalance.toString(), 
    '1'
  );
  
  clearTimeoutCheck();
  console.log("✅ SUCCESS: Function completed!");
  console.log("Results length:", results.length);
  
  if (results.length > 0) {
    console.log("First month:", results[0].month, "Savings:", results[0].monthlySaving);
    console.log("Last month:", results[results.length - 1].month, "Balance:", results[results.length - 1].endBalance);
  }
  
} catch (error) {
  clearTimeoutCheck();
  console.error("❌ ERROR:", error.message);
  console.error("Stack:", error.stack);
}

console.log("Debug test completed."); 