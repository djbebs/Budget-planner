// Test CommonJS version
console.log("=== COMMONJS TEST ===");

setTimeout(() => {
  console.error("❌ TIMEOUT: CommonJS import hung");
  process.exit(1);
}, 5000);

console.log("Importing CommonJS utils...");
try {
  const utils = require('./utils_commonjs.js');
  console.log("✅ CommonJS import successful!");
  
  console.log("Testing function call...");
  const result = utils.getMonthlyCalculationDetails([], "20000", "200", "1");
  console.log("✅ Function call successful! Result:", result.length, "items");
  
} catch (error) {
  console.error("❌ Error:", error.message);
}

console.log("✅ CommonJS test completed!"); 