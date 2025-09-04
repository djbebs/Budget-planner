// Test the monthly savings rate fix
import { getMonthlyCalculationDetails } from './src/utils.js';

const testExpenses = [
  {
    description: "Driveway",
    amount: 22000,
    recurrence: "One-off",
    paymentSchedule: "15.09",
    startDate: "2026-09-01",
    endDate: "2026-09-30"
  },
  {
    description: "new car",
    amount: 5000,
    recurrence: "One-off",
    paymentSchedule: "15.06",
    startDate: "2027-06-01",
    endDate: "2027-06-30"
  }
];

console.log("=== TESTING MONTHLY SAVINGS RATE FIX ===");

// Test with the scenario from the screenshot
const startingBalance = 20000; // Starting balance
const targetBalance = 3000; // Target balance

console.log("Test scenario:");
console.log(`Starting Balance: CHF ${startingBalance.toFixed(2)}`);
console.log(`Target Balance: CHF ${targetBalance.toFixed(2)}`);
console.log(`One-off Expenses: Driveway (Sep 2026), new car (Jun 2027)`);

try {
  const results = getMonthlyCalculationDetails(testExpenses, startingBalance.toString(), targetBalance.toString(), '1');
  
  // Find September 2026 (the month with the driveway expense)
  const sep2026 = results.find(r => r.month.includes('Sep') && r.month.includes('2026'));
  
  if (sep2026) {
    console.log("\nSeptember 2026 calculation:");
    console.log(`Start Balance: CHF ${sep2026.startBalance.toFixed(2)}`);
    console.log(`Monthly Saving: CHF ${sep2026.monthlySaving.toFixed(2)}`);
    console.log(`Total Expenses: CHF ${sep2026.totalExpenses.toFixed(2)}`);
    console.log(`End Balance: CHF ${sep2026.endBalance.toFixed(2)}`);
    
    // Check if the balance is above target
    if (sep2026.endBalance >= targetBalance) {
      console.log("✅ SUCCESS: Balance is above target after large expense");
    } else {
      console.log("❌ FAILED: Balance went below target");
    }
  }
  
  // Find June 2027 (the month with the new car expense)
  const jun2027 = results.find(r => r.month.includes('Jun') && r.month.includes('2027'));
  
  if (jun2027) {
    console.log("\nJune 2027 calculation:");
    console.log(`Start Balance: CHF ${jun2027.startBalance.toFixed(2)}`);
    console.log(`Monthly Saving: CHF ${jun2027.monthlySaving.toFixed(2)}`);
    console.log(`Total Expenses: CHF ${jun2027.totalExpenses.toFixed(2)}`);
    console.log(`End Balance: CHF ${jun2027.endBalance.toFixed(2)}`);
    
    // Check if the balance is above target
    if (jun2027.endBalance >= targetBalance) {
      console.log("✅ SUCCESS: Balance is above target after large expense");
    } else {
      console.log("❌ FAILED: Balance went below target");
    }
  }
  
  // Show the monthly savings rate
  if (results.length > 0) {
    console.log(`\nMonthly Savings Rate: CHF ${results[0].monthlySaving.toFixed(2)}`);
  }
  
  // Verify that no month goes below target
  console.log("\nVerifying no month goes below target:");
  let allMonthsAboveTarget = true;
  let lowestBalance = Infinity;
  
  for (let i = 0; i < results.length; i++) {
    const month = results[i];
    if (month.endBalance < lowestBalance) {
      lowestBalance = month.endBalance;
    }
    if (month.endBalance < targetBalance) {
      console.log(`❌ Month ${month.month} goes below target: ${month.endBalance.toFixed(2)} < ${targetBalance.toFixed(2)}`);
      allMonthsAboveTarget = false;
    }
  }
  
  if (allMonthsAboveTarget) {
    console.log("✅ SUCCESS: All months maintain balance above target");
    console.log(`Lowest balance reached: CHF ${lowestBalance.toFixed(2)}`);
  } else {
    console.log("❌ FAILED: Some months go below target");
  }
  
} catch (error) {
  console.error("Error running test:", error);
} 