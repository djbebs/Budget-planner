// Test the realistic algorithm that doesn't accumulate excessive wealth
console.log("=== REALISTIC ALGORITHM TEST ===");

// Simulate your real expense pattern
const startingBalance = 20000;
const targetBalance = 3000;
const monthlyExpenses = [
  7688, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // Aug 2025: tax 2023
  0, 0, 0, 0, 0, 30285, 0, 0, 0, 0, 0, 0,  // May 2026: large expenses
  0, 0, 0, 0, 0, 30285, 0, 0, 0, 0, 0, 0,  // May 2027: large expenses
  0, 0, 0, 0, 0, 30285, 0, 0, 0, 0, 0, 0,  // May 2028: large expenses
  0, 0, 0, 0, 0, 30285, 0, 0, 0, 0, 0, 0   // May 2029: large expenses
];

console.log(`Starting Balance: ${startingBalance}`);
console.log(`Target Balance: ${targetBalance}`);
console.log(`Number of months: ${monthlyExpenses.length}`);

// Calculate total and average expenses
const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense, 0);
const averageMonthlyExpenses = totalExpenses / monthlyExpenses.length;

console.log(`\nExpense Analysis:`);
console.log(`Total Expenses: ${totalExpenses.toFixed(2)}`);
console.log(`Average Monthly Expenses: ${averageMonthlyExpenses.toFixed(2)}`);

// Calculate realistic monthly savings
const startingBuffer = startingBalance - targetBalance;
const totalDeficit = totalExpenses - startingBuffer;

let requiredMonthlySavings = 0;
if (totalDeficit > 0) {
  requiredMonthlySavings = (totalDeficit / monthlyExpenses.length) + 50;
} else {
  requiredMonthlySavings = 50;
}

requiredMonthlySavings = Math.max(requiredMonthlySavings, averageMonthlyExpenses);
requiredMonthlySavings += 100;

console.log(`\nRealistic Calculation:`);
console.log(`Starting Buffer: ${startingBuffer}`);
console.log(`Total Deficit: ${totalDeficit.toFixed(2)}`);
console.log(`Required Monthly Savings: ${requiredMonthlySavings.toFixed(2)}`);

// Simulate the balance over time
console.log(`\nBalance Simulation:`);
let balance = startingBalance;
let minBalance = balance;
let maxBalance = balance;

for (let month = 0; month < monthlyExpenses.length; month++) {
  balance += requiredMonthlySavings;
  balance -= monthlyExpenses[month];
  
  if (balance < minBalance) minBalance = balance;
  if (balance > maxBalance) maxBalance = balance;
  
  if (month < 12) { // Show first year
    console.log(`Month ${month + 1}: ${balance.toFixed(2)} (expense: ${monthlyExpenses[month].toFixed(2)})`);
  }
}

console.log(`\nResults:`);
console.log(`Final Balance: ${balance.toFixed(2)}`);
console.log(`Minimum Balance: ${minBalance.toFixed(2)}`);
console.log(`Maximum Balance: ${maxBalance.toFixed(2)}`);
console.log(`Above target? ${minBalance >= targetBalance ? 'YES' : 'NO'}`);
console.log(`Reasonable growth? ${maxBalance < startingBalance * 2 ? 'YES' : 'NO'}`);

if (minBalance >= targetBalance && maxBalance < startingBalance * 2) {
  console.log("\n✅ SUCCESS: Algorithm maintains target balance without excessive accumulation");
} else {
  console.log("\n❌ FAILED: Algorithm needs adjustment");
}

console.log("\nTest completed successfully!"); 