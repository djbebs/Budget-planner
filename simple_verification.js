// Simple verification test
console.log("=== SIMPLE VERIFICATION ===");

// Test the mathematical calculation from the screenshot
const startBalance = 14417.43;
const monthlySaving = 6850.91;
const totalExpenses = 29920.00;

console.log("Values from screenshot (Sep 2026):");
console.log(`Start Balance: CHF ${startBalance.toFixed(2)}`);
console.log(`Monthly Saving: CHF ${monthlySaving.toFixed(2)}`);
console.log(`Total Expenses: CHF ${totalExpenses.toFixed(2)}`);

// Correct calculation
const correctEndBalance = startBalance + monthlySaving - totalExpenses;
console.log(`\nCorrect calculation:`);
console.log(`${startBalance} + ${monthlySaving} - ${totalExpenses} = ${correctEndBalance.toFixed(2)}`);

// What the screenshot showed
const screenshotEndBalance = 3000.00;
console.log(`\nScreenshot showed: CHF ${screenshotEndBalance.toFixed(2)}`);
console.log(`This was mathematically incorrect!`);

console.log(`\nThe difference is: CHF ${(correctEndBalance - screenshotEndBalance).toFixed(2)}`);

if (correctEndBalance < 0) {
  console.log(`\n✅ CONCLUSION: The correct end balance should be negative (CHF ${correctEndBalance.toFixed(2)})`);
  console.log("The algorithm should calculate a higher monthly savings rate to prevent this.");
} else {
  console.log(`\nThe correct end balance is positive: CHF ${correctEndBalance.toFixed(2)}`);
}

console.log("\nThe algorithm should calculate a monthly savings rate that ensures the balance never goes below the target.");
console.log("This requires looking at the entire projection period, not just individual months."); 