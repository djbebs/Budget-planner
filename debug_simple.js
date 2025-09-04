// Debug test
console.log("Starting debug test...");

try {
  const { getMonthlyCalculationDetails } = require('./src/utils.js');
  console.log("Successfully imported getMonthlyCalculationDetails");
  
  const testExpenses = [];
  const startingBalance = 1000;
  const targetBalance = 100;
  
  console.log("Calling function with no expenses...");
  const results = getMonthlyCalculationDetails(testExpenses, startingBalance.toString(), targetBalance.toString(), '1');
  
  console.log("Function completed, results length:", results.length);
  
} catch (error) {
  console.error("Error occurred:", error.message);
  console.error("Stack:", error.stack);
}

console.log("Debug test completed."); 