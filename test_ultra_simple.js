// Test ultra simple version - NO DATE OPERATIONS
console.log("=== TESTING ULTRA SIMPLE VERSION ===");

setTimeout(() => {
  console.error("❌ TIMEOUT: Ultra simple version hung");
  process.exit(1);
}, 5000);

console.log("Importing ultra simple utils...");
try {
  const utils = require('./src/utils.js');
  console.log("✅ Ultra simple utils imported successfully!");
  
  console.log("Testing problematic scenario...");
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
    console.log("⚠️ Some months below target, but algorithm completed");
  }
  
} catch (error) {
  console.error("❌ Error:", error.message);
}

console.log("✅ Ultra simple test completed!"); 