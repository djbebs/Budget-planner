// Minimal test to reproduce hanging issue
console.log("=== MINIMAL HANGING TEST ===");

const { getMonthlyCalculationDetails } = require('./src/utils.js');

// Exact problematic scenario
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

console.log("Starting test with timeout...");

// Set timeout to kill process if it hangs
setTimeout(() => {
  console.error("❌ TIMEOUT: Test hung for more than 20 seconds");
  process.exit(1);
}, 20000);

try {
  console.log("Calling function...");
  const results = getMonthlyCalculationDetails(testExpenses, "20000", "200", "1");
  console.log("✅ Test completed! Results:", results.length, "months");
} catch (error) {
  console.error("❌ Error:", error.message);
} 