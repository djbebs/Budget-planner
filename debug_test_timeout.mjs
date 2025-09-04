import { getMonthlyCalculationDetails } from './src/utils.js';

// Simulate the expense data that's causing the issue based on the screenshots
const testExpenses = [
  {
    description: "Tax Installments",
    amount: "200",
    recurrence: "Irregular",
    paymentSchedule: "15.3;15.6;15.9;15.12",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Tax Installments(Comparis)",
    amount: "4560",
    recurrence: "Irregular", 
    paymentSchedule: "15.3;15.6;15.9;15.12",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Tax Installments(Comparis)",
    amount: "3360",
    recurrence: "Irregular",
    paymentSchedule: "15.3;15.6;15.9;15.12", 
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "tax 2023",
    amount: "7688",
    recurrence: "One-off",
    paymentSchedule: "15.8",
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  },
  {
    description: "Driveway",
    amount: "22000",
    recurrence: "One-off", 
    paymentSchedule: "15.9",
    startDate: "2026-01-01",
    endDate: "2026-12-31"
  }
];

// Test with the same parameters from the screenshots
const currentAmount = "5000";  // Starting balance (CHF 5000.00 from screenshots)
const targetAmount = "5000";   // Target balance (seems to be 5000 based on balance resets)
const adjustmentCycleYears = "1";

console.log("=== DEBUGGING MONTHLY SAVINGS CALCULATION ===");
console.log("Current Amount:", currentAmount);
console.log("Target Amount:", targetAmount);
console.log("Adjustment Cycle Years:", adjustmentCycleYears);
console.log("");

// Set a timeout to prevent infinite loops
const timeout = setTimeout(() => {
  console.log("TIMEOUT: Calculation took too long, likely infinite loop");
  process.exit(1);
}, 10000); // 10 second timeout

try {
  // Run the calculation
  const results = getMonthlyCalculationDetails(testExpenses, currentAmount, targetAmount, adjustmentCycleYears);

  clearTimeout(timeout);
  
  console.log("=== CALCULATION COMPLETED ===");
  console.log("Total months calculated:", results.length);
  console.log("");

  // Find the months around Sep 2026 (the last one-off payment)
  const sep2026Index = results.findIndex(r => r.month.includes('Sep') && r.month.includes('2026'));
  const oct2026Index = results.findIndex(r => r.month.includes('Oct') && r.month.includes('2026'));

  console.log("=== RESULTS AROUND LAST ONE-OFF PAYMENT ===");
  if (sep2026Index >= 0) {
    const sep = results[sep2026Index];
    console.log(`Sep 2026: Start=${sep.startBalance.toFixed(2)}, Savings=${sep.monthlySaving.toFixed(2)}, Expenses=${sep.totalExpenses.toFixed(2)}, End=${sep.endBalance.toFixed(2)}`);
  }

  if (oct2026Index >= 0) {
    const oct = results[oct2026Index];
    console.log(`Oct 2026: Start=${oct.startBalance.toFixed(2)}, Savings=${oct.monthlySaving.toFixed(2)}, Expenses=${oct.totalExpenses.toFixed(2)}, End=${oct.endBalance.toFixed(2)}`);
  }

  // Show a few more months after
  for (let i = oct2026Index; i < Math.min(oct2026Index + 5, results.length); i++) {
    if (i >= 0) {
      const month = results[i];
      console.log(`${month.month}: Start=${month.startBalance.toFixed(2)}, Savings=${month.monthlySaving.toFixed(2)}, Expenses=${month.totalExpenses.toFixed(2)}, End=${month.endBalance.toFixed(2)}`);
    }
  }

  console.log("");
  console.log("=== FINAL BALANCE ===");
  const lastMonth = results[results.length - 1];
  console.log(`Final month (${lastMonth.month}): Balance=${lastMonth.endBalance.toFixed(2)}`);

} catch (error) {
  clearTimeout(timeout);
  console.error("Error during calculation:", error);
  console.error("Stack trace:", error.stack);
} 