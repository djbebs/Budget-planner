// Test minimal utils import
console.log("=== MINIMAL IMPORT TEST ===");

setTimeout(() => {
  console.error("❌ TIMEOUT: Minimal import hung");
  process.exit(1);
}, 5000);

console.log("Importing minimal utils...");
try {
  const utils = require('./utils_minimal.js');
  console.log("✅ Minimal import successful!");
  
  console.log("Testing function call...");
  const result = utils.getMonthlyCalculationDetails([], "20000", "200", "1");
  console.log("✅ Function call successful! Result:", result.length, "items");
  
} catch (error) {
  console.error("❌ Error:", error.message);
}

console.log("✅ Minimal test completed!"); 