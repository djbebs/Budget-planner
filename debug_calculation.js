// Simple test to debug the monthly saving calculation
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
  },
  {
    description: "Tax Installments",
    amount: 4560,
    recurrence: "Irregular",
    paymentSchedule: "15.05;15.11",
    startDate: "2027-01-01",
    endDate: "2030-12-31"
  }
];

// Simulate the calculation logic manually
const startingBalance = 50000;
const targetBalance = 10000;
const startDate = new Date(2027, 0, 1); // Jan 2027
const endProjection = new Date(2030, 11, 31); // Dec 2030
const monthsToProject = (endProjection.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endProjection.getMonth() - startDate.getMonth());

console.log("=== MANUAL CALCULATION DEBUG ===");
console.log("Starting balance:", startingBalance);
console.log("Target balance:", targetBalance);
console.log("Months to project:", monthsToProject);
console.log("");

// Parse expenses manually
const allExpenses = [];
testExpenses.forEach(expense => {
  const amount = parseFloat(expense.amount);
  
  if (expense.recurrence === 'One-off') {
    const [day, month] = expense.paymentSchedule.split('.');
    const year = new Date(expense.startDate).getFullYear();
    const dateObj = new Date(year, parseInt(month) - 1, parseInt(day));
    
    console.log(`One-off expense: ${expense.description} on ${dateObj.toLocaleDateString()}`);
    
    allExpenses.push({
      date: dateObj,
      amount: amount,
      isOneOff: true,
      description: expense.description
    });
  } else if (expense.recurrence === 'Irregular') {
    const dates = expense.paymentSchedule.split(';');
    const perPayment = amount / dates.length;
    
    dates.forEach(dateStr => {
      const [day, month] = dateStr.trim().split('.');
      for (let year = 2027; year <= 2030; year++) {
        const dateObj = new Date(year, parseInt(month) - 1, parseInt(day));
        if (dateObj >= new Date(expense.startDate) && dateObj <= new Date(expense.endDate)) {
          allExpenses.push({
            date: dateObj,
            amount: perPayment,
            isOneOff: false,
            description: expense.description
          });
        }
      }
    });
  }
});

allExpenses.sort((a, b) => a.date - b.date);

// Create month buckets
const expensesByMonth = Array(monthsToProject).fill(0).map(() => []);
allExpenses.forEach(exp => {
  const monthIndex = (exp.date.getFullYear() - startDate.getFullYear()) * 12 + 
                     (exp.date.getMonth() - startDate.getMonth());
  if (monthIndex >= 0 && monthIndex < monthsToProject) {
    expensesByMonth[monthIndex].push(exp);
  }
});

// Find one-off payment months
const oneOffPaymentMonths = [];
for (let month = 0; month < monthsToProject; month++) {
  const hasOneOffExpense = expensesByMonth[month].some(exp => exp.isOneOff);
  if (hasOneOffExpense) {
    oneOffPaymentMonths.push(month);
    console.log(`Month ${month} (${new Date(startDate.getFullYear(), startDate.getMonth() + month, 1).toLocaleString('default', { month: 'short', year: 'numeric' })}): One-off payment`);
    expensesByMonth[month].filter(exp => exp.isOneOff).forEach(exp => {
      console.log(`  - ${exp.description}: ${exp.amount.toFixed(2)}`);
    });
  }
}

console.log("");
console.log("One-off payment months:", oneOffPaymentMonths);

// Create periods
const periods = [];
let currentMonth = 0;

for (let i = 0; i < oneOffPaymentMonths.length; i++) {
  const oneOffMonth = oneOffPaymentMonths[i];
  
  // Period before this one-off payment
  if (currentMonth < oneOffMonth) {
    periods.push({
      start: currentMonth,
      end: oneOffMonth - 1,
      nextOneOffMonth: oneOffMonth
    });
    console.log(`Period ${currentMonth}-${oneOffMonth - 1} (before one-off in month ${oneOffMonth})`);
  }
  
  // Period after this one-off payment (until next one or end)
  const nextOneOffMonth = i < oneOffPaymentMonths.length - 1 ? oneOffPaymentMonths[i + 1] : null;
  if (oneOffMonth + 1 < (nextOneOffMonth || monthsToProject)) {
    periods.push({
      start: oneOffMonth + 1,
      end: (nextOneOffMonth || monthsToProject) - 1,
      nextOneOffMonth: nextOneOffMonth
    });
    console.log(`Period ${oneOffMonth + 1}-${(nextOneOffMonth || monthsToProject) - 1} (after one-off in month ${oneOffMonth}, next one-off: ${nextOneOffMonth || 'none'})`);
  }
  
  currentMonth = nextOneOffMonth || monthsToProject;
}

console.log("");
console.log("Created periods:", periods); 