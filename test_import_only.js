// Test if the hang happens during import
console.log("=== IMPORT TEST ===");

console.log("Setting timeout...");
setTimeout(() => {
  console.error("❌ TIMEOUT: Import hung for more than 10 seconds");
  process.exit(1);
}, 10000);

console.log("About to import utils.js...");

try {
  console.log("Importing...");
  const utils = require('./src/utils.js');
  console.log("✅ Import successful!");
  console.log("Available functions:", Object.keys(utils));
} catch (error) {
  console.error("❌ Import failed:", error.message);
}

console.log("✅ Test completed!"); 