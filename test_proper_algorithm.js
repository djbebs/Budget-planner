// Test the properly fixed algorithm
import { getMonthlyCalculationDetails } from './src/utils.js';

const testExpenses = [
  {
    description: "School Fees",
    amount: 11000,
    recurrence: "One-off",
    paymentSchedule: "15.01",
    startDate: "2028-01-01",
    endDate: "2028-12-31"
  },
  {
    description: "Driveway",
    amount: 22000,
    recurrence: "One-off",
    paymentSchedule: "15.09",
    startDate: "2026-09-01",
    endDate: "2026-09-30"
  }
];

console.log("=== TESTING PROPERLY FIXED ALGORITHM ===");

// Test with the scenario from the screenshot
const startingBalance = 20000; // From Aug 2025
const targetBalance = 3000; // From Sep 2026 end balance

console.log("Test scenario:");
console.log(`Starting Balance: CHF ${startingBalance.toFixed(2)}`);
console.log(`Target Balance: CHF ${targetBalance.toFixed(2)}`);
console.log(`One-off Expenses: School Fees (Jan 2028), Driveway (Sep 2026)`);

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
    
    // Check if the calculation is mathematically correct
    const expectedBalance = sep2026.startBalance + sep2026.monthlySaving - sep2026.totalExpenses;
    console.log(`Expected calculation: ${sep2026.startBalance} + ${sep2026.monthlySaving} - ${sep2026.totalExpenses} = ${expectedBalance.toFixed(2)}`);
    
    if (Math.abs(sep2026.endBalance - expectedBalance) < 0.01) {
      console.log("✅ Mathematical calculation is correct");
    } else {
      console.log("❌ Mathematical calculation is incorrect");
      console.log(`Difference: ${(sep2026.endBalance - expectedBalance).toFixed(2)}`);
    }
    
    // Check if the algorithm prevented going below target
    if (sep2026.endBalance >= targetBalance) {
      console.log("✅ Algorithm correctly prevented going below target balance");
    } else {
      console.log("❌ Algorithm failed to prevent going below target balance");
    }
    
    // Show the savings pattern
    console.log("\nSavings pattern analysis:");
    let currentSavingsRate = null;
    let periodStart = null;
    
    for (let i = 0; i < results.length; i++) {
      const month = results[i];
      if (month.monthlySaving !== currentSavingsRate) {
        if (currentSavingsRate !== null) {
          console.log(`Period ${periodStart} to ${results[i-1].month}: Monthly saving = ${currentSavingsRate.toFixed(2)}`);
        }
        currentSavingsRate = month.monthlySaving;
        periodStart = month.month;
      }
    }
    
    if (currentSavingsRate !== null) {
      console.log(`Period ${periodStart} to ${results[results.length-1].month}: Monthly saving = ${currentSavingsRate.toFixed(2)}`);
    }
    
    // Verify that no month goes below target
    console.log("\nVerifying no month goes below target:");
    let allMonthsAboveTarget = true;
    for (let i = 0; i < results.length; i++) {
      const month = results[i];
      if (month.endBalance < targetBalance) {
        console.log(`❌ Month ${month.month} goes below target: ${month.endBalance.toFixed(2)} < ${targetBalance.toFixed(2)}`);
        allMonthsAboveTarget = false;
      }
    }
    
    if (allMonthsAboveTarget) {
      console.log("✅ All months maintain balance above target");
    }
    
  } else {
    console.log("Could not find September 2026 in results");
  }
  
} catch (error) {
  console.error("Error running test:", error);
} 