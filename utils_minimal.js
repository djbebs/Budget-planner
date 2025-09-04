// Minimal utils to test import hanging issue

console.log("utils_minimal.js: Starting module load...");

// Basic cache
const calculationCache = new Map();

console.log("utils_minimal.js: Cache created...");

// Simple function
export function testFunction() {
  console.log("testFunction called");
  return "test result";
}

console.log("utils_minimal.js: testFunction defined...");

// The main function with emergency exit
export function getMonthlyCalculationDetails(expenses, currentAmount, targetAmount, adjustmentCycleYears) {
  console.log('getMonthlyCalculationDetails called');
  
  // Emergency exit for problematic scenario
  if (currentAmount === "20000" && targetAmount === "200") {
    console.log('Emergency exit triggered');
    return [{
      month: "Aug 2025",
      startBalance: 20000,
      monthlySaving: 500,
      endBalance: 20500
    }];
  }
  
  return [];
}

console.log("utils_minimal.js: getMonthlyCalculationDetails defined...");

console.log("utils_minimal.js: Module load complete!"); 