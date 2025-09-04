// Test the new simple utils
console.log("=== TESTING NEW SIMPLE UTILS ===");

setTimeout(() => {
  console.error("❌ TIMEOUT: New utils hung");
  process.exit(1);
}, 10000);

console.log("Importing new utils...");
try {
  const utils = require('./src/utils_new.js');
  console.log("✅ New utils imported successfully!");
  
  console.log("Testing with problematic scenario...");
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
  
  const result = utils.getMonthlyCalculationDetails(testExpenses, "20000", "200", "1");
  console.log("✅ Function completed! Generated", result.length, "months");
  
  // Check target balance compliance
  const belowTarget = result.filter(r => r.belowTargetBalance);
  console.log(`Target balance check: ${belowTarget.length} months below target`);
  
  if (belowTarget.length === 0) {
    console.log("✅ SUCCESS: No months go below target balance!");
  } else {
    console.log("⚠️  Some months below target, but algorithm completed");
  }
  
  // Show first and last month
  if (result.length > 0) {
    const first = result[0];
    const last = result[result.length - 1];
    console.log(`First month: ${first.month}, Savings: ${first.monthlySaving}, Balance: ${first.endBalance}`);
    console.log(`Last month: ${last.month}, Savings: ${last.monthlySaving}, Balance: ${last.endBalance}`);
  }
  
} catch (error) {
  console.error("❌ Error:", error.message);
}

console.log("✅ New utils test completed!"); 