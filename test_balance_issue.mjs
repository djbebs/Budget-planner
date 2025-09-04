import { getMonthlyCalculationDetails } from './src/utils.js';

// Test with no expenses first
const noExpenses = [];

// Test with one-off expense
const testExpenses = [
  {
    description: "Test One-off",
    amount: "5000",
    recurrence: "One-off",
    paymentSchedule: "15.8",
    oneOffDate: "2025-08-15",
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  }
];

console.log('=== Testing Balance Control Issue ===\n');

try {
  // Test with no expenses first
  console.log('--- Test 1: No Expenses, Starting Balance 10000, Target 2500 ---');
  const resultNoExp = getMonthlyCalculationDetails(noExpenses, '10000', '2500', '1');
  console.log('Result length:', resultNoExp.length);
  
  if (resultNoExp.length > 0) {
    console.log('First month savings:', resultNoExp[0]?.monthlySaving?.toFixed(2) || 'N/A');
    console.log('Max acceptable balance (2x target):', 2500 * 2);
    console.log('Starting balance > max acceptable?', 10000 > (2500 * 2));
    
    // Show first few months for no expenses case
    console.log('\n--- First 5 months (No Expenses) ---');
    for (let i = 0; i < 5 && i < resultNoExp.length; i++) {
      const month = resultNoExp[i];
      console.log(`  ${month.month}: Start=${month.startBalance.toFixed(2)}, Savings=${month.monthlySaving.toFixed(2)}, End=${month.endBalance.toFixed(2)}`);
    }
  } else {
    console.log('No results returned - this indicates the function returns empty array for no expenses');
  }

  console.log('\n--- Manual Calculation Check ---');
  const startingBalance = 10000;
  const targetBalance = 2500;
  const maxAcceptableBalance = targetBalance * 2; // 5000
  const monthsToProject = 65; // approximately 5+ years

  console.log(`Starting balance: ${startingBalance}`);
  console.log(`Target balance: ${targetBalance}`);
  console.log(`Max acceptable balance: ${maxAcceptableBalance}`);
  console.log(`Months to project: ${monthsToProject}`);

  // For no expenses case
  const remainingExpenses = 0;
  const idealEndBalance = Math.min(targetBalance + 0, maxAcceptableBalance); // Should be targetBalance
  const idealRate = (remainingExpenses + idealEndBalance - startingBalance) / monthsToProject;

  console.log(`Remaining expenses: ${remainingExpenses}`);
  console.log(`Ideal end balance: ${idealEndBalance}`);
  console.log(`Ideal rate: (${remainingExpenses} + ${idealEndBalance} - ${startingBalance}) / ${monthsToProject} = ${idealRate.toFixed(2)}`);
  console.log(`Should be negative: ${idealRate < 0}`);

} catch (error) {
  console.error('Error during test:', error);
  console.error('Stack:', error.stack);
}

console.log('\n--- Test 2: With One-off Expense, Starting Balance 10000, Target 2500 ---');
const resultWithExp = getMonthlyCalculationDetails(testExpenses, '10000', '2500', '1');
console.log('First month savings:', resultWithExp[0]?.monthlySaving?.toFixed(2) || 'N/A');

console.log('\n--- Analysis ---');
console.log('The issue might be:');
console.log('1. When no expenses: algorithm creates single period for entire projection');
console.log('2. idealRate calculation: (remainingExpenses + idealEndBalance - simulatedBalance) / monthsRemaining');
console.log('3. If remainingExpenses = 0, idealRate = (idealEndBalance - simulatedBalance) / monthsRemaining');
console.log('4. If idealEndBalance < simulatedBalance, idealRate should be negative');

// Show calculation details
console.log('\n--- Manual Calculation Check ---');
const startingBalance = 10000;
const targetBalance = 2500;
const maxAcceptableBalance = targetBalance * 2; // 5000
const monthsToProject = 65; // approximately 5+ years

console.log(`Starting balance: ${startingBalance}`);
console.log(`Target balance: ${targetBalance}`);
console.log(`Max acceptable balance: ${maxAcceptableBalance}`);
console.log(`Months to project: ${monthsToProject}`);

// For no expenses case
const remainingExpenses = 0;
const idealEndBalance = Math.min(targetBalance + 0, maxAcceptableBalance); // Should be targetBalance
const idealRate = (remainingExpenses + idealEndBalance - startingBalance) / monthsToProject;

console.log(`Remaining expenses: ${remainingExpenses}`);
console.log(`Ideal end balance: ${idealEndBalance}`);
console.log(`Ideal rate: (${remainingExpenses} + ${idealEndBalance} - ${startingBalance}) / ${monthsToProject} = ${idealRate.toFixed(2)}`);
console.log(`Should be negative: ${idealRate < 0}`);

// Show first few months for no expenses case
console.log('\n--- First 5 months (No Expenses) ---');
for (let i = 0; i < 5 && i < resultNoExp.length; i++) {
  const month = resultNoExp[i];
  console.log(`  ${month.month}: Start=${month.startBalance.toFixed(2)}, Savings=${month.monthlySaving.toFixed(2)}, End=${month.endBalance.toFixed(2)}`);
} 