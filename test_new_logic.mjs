import { getMonthlyCalculationDetails } from './src/utils.js';

// Test data similar to the example in the image
const testExpenses = [
  {
    description: "School Fees",
    amount: 11000,
    recurrence: "One-off",
    paymentSchedule: "15.05",
    startDate: "2027-01-01",
    endDate: "2027-12-31"
  },
  {
    description: "AXA Household Insurance",
    amount: 1200,
    recurrence: "Annual",
    nextDueDate: "2027-03-15",
    startDate: "2027-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Tax Installments",
    amount: 4560,
    recurrence: "Irregular",
    paymentSchedule: "15.05;15.11",
    startDate: "2027-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Annual TV/Radio tax",
    amount: 335,
    recurrence: "Annual",
    nextDueDate: "2027-02-28",
    startDate: "2027-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "A new car",
    amount: 5000,
    recurrence: "One-off",
    paymentSchedule: "15.05",
    startDate: "2027-01-01",
    endDate: "2027-12-31"
  },
  {
    description: "Driveway",
    amount: 22000,
    recurrence: "One-off",
    paymentSchedule: "15.03",
    startDate: "2028-01-01",
    endDate: "2028-12-31"
  }
];

const currentAmount = 50000; // Starting balance
const targetAmount = 10000; // Target balance
const adjustmentCycleYears = 1;

console.log("=== TESTING NEW SIMPLIFIED MONTHLY SAVING LOGIC ===");
console.log("Starting balance:", currentAmount);
console.log("Target balance:", targetAmount);
console.log("Number of one-off expenses:", testExpenses.filter(e => e.recurrence === 'One-off').length);
console.log("");

try {
  const results = getMonthlyCalculationDetails(testExpenses, currentAmount, targetAmount, adjustmentCycleYears);

  console.log("=== CALCULATION RESULTS ===");
  console.log("Total months calculated:", results.length);
  console.log("");

  // Show key months around one-off payments
  const keyMonths = [
    { name: "May 2027", pattern: /May 2027/ },
    { name: "June 2027", pattern: /Jun 2027/ },
    { name: "March 2028", pattern: /Mar 2028/ },
    { name: "April 2028", pattern: /Apr 2028/ },
    { name: "May 2028", pattern: /May 2028/ },
    { name: "June 2028", pattern: /Jun 2028/ }
  ];

  keyMonths.forEach(({ name, pattern }) => {
    const month = results.find(r => pattern.test(r.month));
    if (month) {
      console.log(`${name}:`);
      console.log(`  Start Balance: ${month.startBalance.toFixed(2)}`);
      console.log(`  Monthly Saving: ${month.monthlySaving.toFixed(2)}`);
      console.log(`  Total Expenses: ${month.totalExpenses.toFixed(2)}`);
      console.log(`  End Balance: ${month.endBalance.toFixed(2)}`);
      console.log(`  Has One-off: ${month.hasSignificantExpense}`);
      console.log(`  Is Adjustment: ${month.isInAdjustmentCycle}`);
      console.log("");
    }
  });

  // Show savings pattern analysis
  console.log("=== SAVINGS PATTERN ANALYSIS ===");
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
  
  // Show last period
  if (currentSavingsRate !== null) {
    console.log(`Period ${periodStart} to ${results[results.length-1].month}: Monthly saving = ${currentSavingsRate.toFixed(2)}`);
  }

  console.log("");
  console.log("=== FINAL BALANCE ===");
  const lastMonth = results[results.length - 1];
  console.log(`Final month (${lastMonth.month}): Balance = ${lastMonth.endBalance.toFixed(2)}`);
  console.log(`Target balance: ${targetAmount}`);
  console.log(`Difference: ${(lastMonth.endBalance - targetAmount).toFixed(2)}`);

} catch (error) {
  console.error("Error in calculation:", error);
} 