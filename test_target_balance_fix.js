// Test target balance respect
const { getMonthlyCalculationDetails } = require('./src/utils.js');

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

console.log("=== TESTING TARGET BALANCE RESPECT ===");

const startingBalance = 20000;
const targetBalance = 200; // Low target to test over-saving

console.log(`Starting Balance: CHF ${startingBalance.toFixed(2)}`);
console.log(`Target Balance: CHF ${targetBalance.toFixed(2)}`);

try {
  const results = getMonthlyCalculationDetails(testExpenses, startingBalance.toString(), targetBalance.toString(), '1');
  
  console.log("\n=== FIRST 5 MONTHS ===");
  results.slice(0, 5).forEach(r => {
    console.log(`${r.month}: Savings=${r.monthlySaving.toFixed(2)}, Balance=${r.endBalance.toFixed(2)}`);
  });
  
  console.log("\n=== LAST 5 MONTHS ===");
  results.slice(-5).forEach(r => {
    console.log(`${r.month}: Savings=${r.monthlySaving.toFixed(2)}, Balance=${r.endBalance.toFixed(2)}`);
  });
  
  // Check unique savings rates
  const uniqueRates = [...new Set(results.map(r => r.monthlySaving))];
  console.log(`\n=== UNIQUE SAVINGS RATES ===`);
  console.log(`Found ${uniqueRates.length} different rates:`);
  uniqueRates.forEach((rate, index) => {
    console.log(`  Rate ${index + 1}: CHF ${rate.toFixed(2)}`);
  });
  
  // Find maximum balance
  const maxBalance = Math.max(...results.map(r => r.endBalance));
  const minBalance = Math.min(...results.map(r => r.endBalance));
  const finalBalance = results[results.length - 1].endBalance;
  
  console.log(`\n=== BALANCE ANALYSIS ===`);
  console.log(`Target Balance: CHF ${targetBalance.toFixed(2)}`);
  console.log(`Minimum Balance: CHF ${minBalance.toFixed(2)}`);
  console.log(`Maximum Balance: CHF ${maxBalance.toFixed(2)}`);
  console.log(`Final Balance: CHF ${finalBalance.toFixed(2)}`);
  console.log(`Over-saving ratio: ${(maxBalance / targetBalance).toFixed(1)}x target`);
  
  // Check months below target
  const monthsBelowTarget = results.filter(r => r.endBalance < targetBalance);
  if (monthsBelowTarget.length === 0) {
    console.log("✅ No months below target balance");
  } else {
    console.log(`❌ ${monthsBelowTarget.length} months below target`);
  }
  
  // Check if over-saving is reduced
  if (maxBalance / targetBalance < 50) {
    console.log("✅ Reasonable over-saving (less than 50x target)");
  } else {
    console.log("❌ Excessive over-saving (more than 50x target)");
  }
  
} catch (error) {
  console.error("Error:", error.message);
} 