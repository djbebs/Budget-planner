// Test the fixed dynamic period algorithm
const { getMonthlyCalculationDetails } = require('./src/utils.js');

const testExpenses = [
  {
    description: "Driveway",
    amount: 22000,
    recurrence: "One-off",
    paymentSchedule: "01.09",
    startDate: "2026-09-01",
    endDate: "2030-12-31"
  },
  {
    description: "New Car",
    amount: 5000,
    recurrence: "One-off",
    paymentSchedule: "01.06",
    startDate: "2027-06-01",
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

console.log("=== TESTING FIXED DYNAMIC PERIOD ALGORITHM ===");

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
  
  // Analyze periods and savings rates
  const periods = [];
  let currentPeriod = { start: 0, savingsRate: results[0].monthlySaving };
  
  for (let i = 1; i < results.length; i++) {
    if (results[i].monthlySaving !== currentPeriod.savingsRate) {
      // End current period
      currentPeriod.end = i - 1;
      periods.push(currentPeriod);
      
      // Start new period
      currentPeriod = { start: i, savingsRate: results[i].monthlySaving };
    }
  }
  
  // End last period
  currentPeriod.end = results.length - 1;
  periods.push(currentPeriod);
  
  console.log(`\n=== PERIODS ANALYSIS ===`);
  console.log(`Found ${periods.length} periods:`);
  
  periods.forEach((period, index) => {
    const periodMonths = period.end - period.start + 1;
    const startMonth = results[period.start].month;
    const endMonth = results[period.end].month;
    
    console.log(`Period ${index + 1}: ${startMonth} to ${endMonth} (${periodMonths} months)`);
    console.log(`  Savings rate: CHF ${period.savingsRate.toFixed(2)}`);
    console.log(`  Total savings: CHF ${(period.savingsRate * periodMonths).toFixed(2)}`);
  });
  
  // Check for savings rate reduction
  if (periods.length > 1) {
    const firstPeriodRate = periods[0].savingsRate;
    const lastPeriodRate = periods[periods.length - 1].savingsRate;
    const reduction = firstPeriodRate - lastPeriodRate;
    const reductionPercent = (reduction / firstPeriodRate) * 100;
    
    console.log(`\n=== SAVINGS REDUCTION ANALYSIS ===`);
    console.log(`First period rate: CHF ${firstPeriodRate.toFixed(2)}`);
    console.log(`Last period rate: CHF ${lastPeriodRate.toFixed(2)}`);
    console.log(`Savings reduction: CHF ${reduction.toFixed(2)} (${reductionPercent.toFixed(1)}%)`);
    
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
        monthlySaving: month.monthlySaving,
        periodIndex: month.periodIndex
      });
    }
  }
  
  if (monthsBelowTarget.length === 0) {
    console.log("✅ No months go below target balance");
  } else {
    console.log(`❌ ${monthsBelowTarget.length} months go below target balance:`);
    monthsBelowTarget.forEach(m => {
      console.log(`  ${m.month}: CHF ${m.endBalance.toFixed(2)} (saving: CHF ${m.monthlySaving.toFixed(2)}, period: ${m.periodIndex})`);
    });
  }
  
  // Show sample months from each period
  console.log("\n=== SAMPLE MONTHS BY PERIOD ===");
  periods.forEach((period, index) => {
    const sampleMonth = Math.floor((period.start + period.end) / 2);
    if (sampleMonth < results.length) {
      const month = results[sampleMonth];
      console.log(`Period ${index + 1} (${month.month}): Balance=${month.endBalance.toFixed(2)}, Savings=${month.monthlySaving.toFixed(2)}, Expenses=${month.totalExpenses.toFixed(2)}`);
    }
  });
  
  // Show final balance
  const finalMonth = results[results.length - 1];
  console.log(`\n=== FINAL BALANCE ===`);
  console.log(`Final month (${finalMonth.month}): CHF ${finalMonth.endBalance.toFixed(2)}`);
  console.log(`Target balance: CHF ${targetBalance.toFixed(2)}`);
  console.log(`Excess: CHF ${(finalMonth.endBalance - targetBalance).toFixed(2)}`);
  
  // Check if savings rates are different
  const uniqueRates = [...new Set(results.map(r => r.monthlySaving))];
  console.log(`\n=== UNIQUE SAVINGS RATES ===`);
  console.log(`Found ${uniqueRates.length} different savings rates:`);
  uniqueRates.forEach((rate, index) => {
    console.log(`  Rate ${index + 1}: CHF ${rate.toFixed(2)}`);
  });
  
  if (uniqueRates.length > 1) {
    console.log("✅ SUCCESS: Dynamic savings rates are working");
  } else {
    console.log("❌ ISSUE: All savings rates are the same");
  }
  
} catch (error) {
  console.error("Error running test:", error);
} 