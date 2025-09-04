// Test the two-phase algorithm
const { getMonthlyCalculationDetails } = require('./src/utils.js');

const testExpenses = [
  {
    description: "Driveway",
    amount: 22000,
    recurrence: "One-off",
    paymentSchedule: "01.09",
    startDate: "2026-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "New Car",
    amount: 5000,
    recurrence: "One-off",
    paymentSchedule: "01.06",
    startDate: "2027-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Annual TV/Radio tax",
    amount: 365,
    recurrence: "Annual",
    nextDueDate: "2026-05-01",
    startDate: "2026-01-01",
    endDate: "2030-12-31"
  }
];

console.log("=== TESTING TWO-PHASE ALGORITHM ===");

const startingBalance = 20000;
const targetBalance = 3000;

console.log("Test scenario:");
console.log(`Starting Balance: CHF ${startingBalance.toFixed(2)}`);
console.log(`Target Balance: CHF ${targetBalance.toFixed(2)}`);
console.log(`Number of expenses: ${testExpenses.length}`);

try {
  const results = getMonthlyCalculationDetails(testExpenses, startingBalance.toString(), targetBalance.toString(), '1');
  
  console.log("\n=== RESULTS ANALYSIS ===");
  console.log(`Total months calculated: ${results.length}`);
  
  // Find the last one-off payment month
  let lastOneOffMonth = -1;
  for (let i = 0; i < results.length; i++) {
    if (results[i].hasSignificantExpense) {
      lastOneOffMonth = i;
    }
  }
  
  console.log(`Last one-off payment month: ${lastOneOffMonth >= 0 ? results[lastOneOffMonth].month : 'None'}`);
  
  // Check for savings rate reduction
  let phase1SavingsRate = null;
  let phase2SavingsRate = null;
  let reductionMonth = null;
  
  for (let i = 0; i < results.length; i++) {
    const month = results[i];
    
    if (i <= lastOneOffMonth) {
      if (phase1SavingsRate === null) {
        phase1SavingsRate = month.monthlySaving;
      }
    } else {
      if (phase2SavingsRate === null) {
        phase2SavingsRate = month.monthlySaving;
        reductionMonth = month.month;
      }
    }
  }
  
  console.log(`Phase 1 savings rate: CHF ${phase1SavingsRate?.toFixed(2) || 'N/A'}`);
  console.log(`Phase 2 savings rate: CHF ${phase2SavingsRate?.toFixed(2) || 'N/A'}`);
  
  if (phase1SavingsRate && phase2SavingsRate) {
    const reduction = phase1SavingsRate - phase2SavingsRate;
    const reductionPercent = (reduction / phase1SavingsRate) * 100;
    
    console.log(`Savings reduction: CHF ${reduction.toFixed(2)} (${reductionPercent.toFixed(1)}%)`);
    console.log(`Reduction starts: ${reductionMonth}`);
    
    if (reduction > 0) {
      console.log("✅ SUCCESS: Savings rate is reduced after last one-off payment");
    } else {
      console.log("❌ ISSUE: No savings rate reduction detected");
    }
  }
  
  // Check for months below target balance
  console.log("\n=== MONTHS BELOW TARGET BALANCE ===");
  let monthsBelowTarget = [];
  
  for (let i = 0; i < results.length; i++) {
    const month = results[i];
    if (month.endBalance < targetBalance) {
      monthsBelowTarget.push({
        month: month.month,
        endBalance: month.endBalance,
        monthlySaving: month.monthlySaving
      });
    }
  }
  
  if (monthsBelowTarget.length === 0) {
    console.log("✅ No months go below target balance");
  } else {
    console.log(`❌ ${monthsBelowTarget.length} months go below target balance:`);
    monthsBelowTarget.forEach(m => {
      console.log(`  ${m.month}: CHF ${m.endBalance.toFixed(2)} (saving: CHF ${m.monthlySaving.toFixed(2)})`);
    });
  }
  
  // Show sample months
  console.log("\n=== SAMPLE MONTHS ===");
  const sampleMonths = [0, Math.floor(results.length / 2), results.length - 1];
  sampleMonths.forEach(index => {
    if (index < results.length) {
      const month = results[index];
      console.log(`${month.month}: Balance=${month.endBalance.toFixed(2)}, Savings=${month.monthlySaving.toFixed(2)}, Expenses=${month.totalExpenses.toFixed(2)}`);
    }
  });
  
} catch (error) {
  console.error("Error running test:", error);
} 