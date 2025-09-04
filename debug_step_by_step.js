// Step-by-step debug to find hanging point
console.log("=== STEP BY STEP DEBUG ===");

// Import individual functions if possible, or test step by step
const utils = require('./src/utils.js');

console.log("Step 1: Setting up timeout...");
setTimeout(() => {
  console.error("❌ TIMEOUT: Hung for more than 15 seconds");
  process.exit(1);
}, 15000);

console.log("Step 2: Preparing test data...");
const testExpenses = [
  {
    description: "Large Expense",
    amount: 22000,
    recurrence: "One-off", 
    paymentSchedule: "01.09",
    startDate: "2026-09-01",
    endDate: "2030-12-31"
  }
];

console.log("Step 3: Calling clearCalculationCache...");
try {
  utils.clearCalculationCache();
  console.log("✅ clearCalculationCache completed");
} catch (error) {
  console.error("❌ clearCalculationCache failed:", error.message);
}

console.log("Step 4: Calling calculateMonthlySavingsNeeded...");
try {
  const monthlySavings = utils.calculateMonthlySavingsNeeded(testExpenses, 20000, 200, 1);
  console.log("✅ calculateMonthlySavingsNeeded completed:", monthlySavings);
} catch (error) {
  console.error("❌ calculateMonthlySavingsNeeded failed:", error.message);
}

console.log("Step 5: About to call getMonthlyCalculationDetails...");
console.log("This is where it might hang...");

try {
  console.log("Calling getMonthlyCalculationDetails NOW...");
  const results = utils.getMonthlyCalculationDetails(testExpenses, "20000", "200", "1");
  console.log("✅ getMonthlyCalculationDetails completed! Length:", results.length);
} catch (error) {
  console.error("❌ getMonthlyCalculationDetails failed:", error.message);
}

console.log("✅ All steps completed successfully!"); 