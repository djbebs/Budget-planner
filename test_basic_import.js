// Very basic import test
console.log("=== BASIC IMPORT TEST ===");

setTimeout(() => {
  console.error("❌ TIMEOUT: Basic import test hung");
  process.exit(1);
}, 3000);

console.log("Step 1: About to require utils...");
const utils = require('./src/utils.js');
console.log("Step 2: Utils imported successfully!");

console.log("Step 3: About to call function...");
const result = utils.getMonthlyCalculationDetails([], "1000", "100", "1");
console.log("Step 4: Function completed! Result length:", result.length);

console.log("✅ Basic test completed!"); 