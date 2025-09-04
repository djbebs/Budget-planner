// Test with real data from the CSV file
const { getMonthlyCalculationDetails } = require('./src/utils.js');

const realExpenses = [
  {
    description: "Tax Installments",
    amount: 1000,
    recurrence: "Irregular",
    paymentSchedule: "12.03;10.05;10.07;09.09;09.11",
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  },
  {
    description: "Tax Installments(Comparis)",
    amount: 22800,
    recurrence: "Irregular",
    paymentSchedule: "12.03;10.05;10.07;09.09;09.11",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Tax Installments",
    amount: 3500,
    recurrence: "Irregular",
    paymentSchedule: "10.03;10.05;10.07;10.09;10.11",
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  },
  {
    description: "Tax Installments(Comparis)",
    amount: 16800,
    recurrence: "Irregular",
    paymentSchedule: "10.03;10.05;10.07;10.09;10.11",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Annual TV/Radio tax",
    amount: 365,
    recurrence: "Annual",
    nextDueDate: "2025-05-01",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Annual PAX B",
    amount: 588,
    recurrence: "Annual",
    nextDueDate: "2025-03-20",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Annual PAX M",
    amount: 588,
    recurrence: "Annual",
    nextDueDate: "2025-03-20",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "AXA Legal Insurance",
    amount: 346.9,
    recurrence: "Annual",
    nextDueDate: "2025-12-20",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "AXA Household Insurance",
    amount: 1144.05,
    recurrence: "Annual",
    nextDueDate: "2025-03-01",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "AXA Tesla",
    amount: 1752.8,
    recurrence: "Annual",
    nextDueDate: "2025-03-01",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Jeep",
    amount: 1215.3,
    recurrence: "Annual",
    nextDueDate: "2025-07-01",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "School Fees",
    amount: 33000,
    recurrence: "Irregular",
    paymentSchedule: "01.01;10.05;11.05",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Electricity (real 2023)",
    amount: 1937,
    recurrence: "Annual",
    nextDueDate: "2025-01-01",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Road tax",
    amount: 485,
    recurrence: "Annual",
    nextDueDate: "2025-01-01",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Vignette",
    amount: 80,
    recurrence: "Annual",
    nextDueDate: "2025-01-01",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "tax 2023",
    amount: 7688,
    recurrence: "One-off",
    paymentSchedule: "01.08",
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  },
  {
    description: "tax 2022",
    amount: 7589.2,
    recurrence: "Irregular",
    paymentSchedule: "31.01;28.02;31.03;30.04",
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  },
  {
    description: "tax 2023",
    amount: 4524.45,
    recurrence: "Irregular",
    paymentSchedule: "31.05;30.06;31.07",
    startDate: "2025-01-01",
    endDate: "2025-12-31"
  },
  {
    description: "Jeep",
    amount: 700,
    recurrence: "Annual",
    nextDueDate: "2025-03-01",
    startDate: "2025-01-01",
    endDate: "2030-12-31"
  },
  {
    description: "Driveway",
    amount: 22000,
    recurrence: "One-off",
    paymentSchedule: "01.09",
    startDate: "2030-09-01",
    endDate: "2030-12-30"
  }
];

console.log("=== TESTING WITH REAL DATA ===");

// Test with the scenario from the screenshot
const startingBalance = 20000; // From Aug 2025
const targetBalance = 3000; // From Sep 2026 end balance

console.log("Test scenario:");
console.log(`Starting Balance: CHF ${startingBalance.toFixed(2)}`);
console.log(`Target Balance: CHF ${targetBalance.toFixed(2)}`);
console.log(`Number of expenses: ${realExpenses.length}`);

try {
  const results = getMonthlyCalculationDetails(realExpenses, startingBalance.toString(), targetBalance.toString(), '1');
  
  // Find months where balance goes below target
  console.log("\n=== MONTHS BELOW TARGET BALANCE ===");
  let monthsBelowTarget = [];
  
  for (let i = 0; i < results.length; i++) {
    const month = results[i];
    if (month.endBalance < targetBalance) {
      monthsBelowTarget.push({
        month: month.month,
        endBalance: month.endBalance,
        startBalance: month.startBalance,
        monthlySaving: month.monthlySaving,
        totalExpenses: month.totalExpenses,
        expenses: month.expenses
      });
    }
  }
  
  if (monthsBelowTarget.length === 0) {
    console.log("✅ No months go below target balance");
  } else {
    console.log(`❌ Found ${monthsBelowTarget.length} months below target balance:`);
    monthsBelowTarget.forEach(m => {
      console.log(`\n${m.month}:`);
      console.log(`  Start Balance: CHF ${m.startBalance.toFixed(2)}`);
      console.log(`  Monthly Saving: CHF ${m.monthlySaving.toFixed(2)}`);
      console.log(`  Total Expenses: CHF ${m.totalExpenses.toFixed(2)}`);
      console.log(`  End Balance: CHF ${m.endBalance.toFixed(2)} (Target: CHF ${targetBalance.toFixed(2)})`);
      console.log(`  Expenses: ${m.expenses.join(', ')}`);
    });
  }
  
  // Show the savings pattern
  console.log("\n=== SAVINGS PATTERN ANALYSIS ===");
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
  
  // Show some key months
  console.log("\n=== KEY MONTHS ANALYSIS ===");
  const keyMonths = ['Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'];
  
  keyMonths.forEach(monthName => {
    const month = results.find(r => r.month === monthName);
    if (month) {
      console.log(`${monthName}: Balance = ${month.endBalance.toFixed(2)}, Expenses = ${month.totalExpenses.toFixed(2)}, Savings = ${month.monthlySaving.toFixed(2)}`);
    }
  });
  
} catch (error) {
  console.error("Error running test:", error);
} 