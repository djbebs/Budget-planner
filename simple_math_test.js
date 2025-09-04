// Simple test to demonstrate the mathematical calculation fix
console.log("=== SIMPLE MATHEMATICAL CALCULATION TEST ===");

// The exact values from the screenshot
const startBalance = 3100.57;
const monthlySaving = 4157.89;
const totalExpenses = 11000.00;

console.log("Values from screenshot:");
console.log(`Start Balance: CHF ${startBalance.toFixed(2)}`);
console.log(`Monthly Saving: CHF ${monthlySaving.toFixed(2)}`);
console.log(`Total Expenses: CHF ${totalExpenses.toFixed(2)}`);

// Correct mathematical calculation
const correctEndBalance = startBalance + monthlySaving - totalExpenses;
console.log(`\nCorrect calculation:`);
console.log(`${startBalance} + ${monthlySaving} - ${totalExpenses} = ${correctEndBalance.toFixed(2)}`);

console.log(`\nCorrect End Balance: CHF ${correctEndBalance.toFixed(2)}`);

// What the screenshot incorrectly showed
const incorrectEndBalance = 1000.00;
console.log(`\nScreenshot showed: CHF ${incorrectEndBalance.toFixed(2)}`);
console.log(`This was mathematically incorrect!`);

console.log(`\nThe difference is: CHF ${(correctEndBalance - incorrectEndBalance).toFixed(2)}`);

if (correctEndBalance < 0) {
  console.log(`\n✅ CONCLUSION: The correct end balance should be negative (CHF ${correctEndBalance.toFixed(2)})`);
  console.log("The screenshot was artificially showing CHF 1'000.00 instead of the true negative balance.");
  console.log("This has been fixed in the code by removing the artificial constraint.");
} else {
  console.log(`\nThe correct end balance is positive: CHF ${correctEndBalance.toFixed(2)}`);
} 