// Simple test without binary search
console.log("=== SIMPLE CALCULATION TEST ===");

const startingBalance = 20000;
const targetBalance = 3000;
const largeExpense = 25000;
const monthsToProject = 12;

console.log(`Starting Balance: ${startingBalance}`);
console.log(`Target Balance: ${targetBalance}`);
console.log(`Large expense: ${largeExpense} in month 5`);

// Simple calculation: we need to save enough to cover the large expense
// while maintaining the target balance
const requiredSavings = (largeExpense - (startingBalance - targetBalance)) / monthsToProject;

console.log(`\nSimple calculation result:`);
console.log(`Required monthly savings: ${requiredSavings.toFixed(2)}`);

// Verify this works
let balance = startingBalance;
let allAboveTarget = true;

for (let month = 0; month < monthsToProject; month++) {
  balance += requiredSavings;
  if (month === 5) { // Month 5 has the large expense
    balance -= largeExpense;
  }
  console.log(`Month ${month + 1}: Balance = ${balance.toFixed(2)}`);
  if (balance < targetBalance) {
    allAboveTarget = false;
    console.log(`❌ Month ${month + 1} goes below target!`);
  }
}

if (allAboveTarget) {
  console.log("\n✅ SUCCESS: All months maintain balance above target");
} else {
  console.log("\n❌ FAILED: Some months go below target");
}

console.log("\nTest completed successfully!"); 