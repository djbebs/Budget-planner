// Debug the specific hanging scenario
console.log("Starting specific scenario debug...");

const { getMonthlyCalculationDetails } = require('./src/utils.js');

// Set a timeout to detect infinite loops
const TIMEOUT_MS = 15000; // 15 seconds
let timeoutId;

function startTimeout() {
  timeoutId = setTimeout(() => {
    console.error("❌ TIMEOUT: Specific scenario took longer than 15 seconds!");
    console.error("Likely infinite loop in verification/adjustment logic");
    process.exit(1);
  }, TIMEOUT_MS);
}

function clearTimeoutCheck() {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

try {
  console.log("Testing exact same parameters as hanging test...");
  startTimeout();
  
  // EXACT same parameters as test_target_balance_fix.js
  const testExpenses = [
    {
      description: "Driveway",
      amount: 22000,
      recurrence: "One-off",
      paymentSchedule: "01.09",
      startDate: "2026-09-01",
      endDate: "2030-12-31"
    }
  ];

  const startingBalance = 20000;
  const targetBalance = 200; // Very low target vs large expense

  console.log("Parameters:");
  console.log(`- Starting Balance: CHF ${startingBalance}`);
  console.log(`- Target Balance: CHF ${targetBalance}`);
  console.log(`- One-off Expense: CHF ${testExpenses[0].amount}`);
  console.log(`- Expense/Target Ratio: ${(testExpenses[0].amount / targetBalance).toFixed(1)}x`);
  
  console.log("Calling getMonthlyCalculationDetails with problematic parameters...");
  
  const results = getMonthlyCalculationDetails(
    testExpenses, 
    startingBalance.toString(), 
    targetBalance.toString(), 
    '1'
  );
  
  clearTimeoutCheck();
  console.log("✅ SUCCESS: Specific scenario completed!");
  console.log("Results length:", results.length);
  
} catch (error) {
  clearTimeoutCheck();
  console.error("❌ ERROR in specific scenario:", error.message);
  console.error("Stack:", error.stack);
}

console.log("Specific scenario debug completed."); 