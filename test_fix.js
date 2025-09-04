// Test the date parsing fix
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
  }
];

console.log("=== TESTING DATE PARSING FIX ===");
console.log("Number of test expenses:", testExpenses.length);

testExpenses.forEach((expense, index) => {
  console.log(`\nExpense ${index + 1}: ${expense.description}`);
  console.log(`  Recurrence: ${expense.recurrence}`);
  console.log(`  Payment Schedule: ${expense.paymentSchedule}`);
  console.log(`  Start Date: ${expense.startDate}`);
  
  if (expense.recurrence === 'One-off' && expense.paymentSchedule) {
    const [day, month] = expense.paymentSchedule.split('.');
    const monthIndex = parseInt(month) - 1;
    
    console.log(`  Parsed day: ${day}, month: ${month}, monthIndex: ${monthIndex}`);
    
    // Determine the correct year based on start date and month
    let year;
    if (expense.startDate) {
      const startYear = new Date(expense.startDate).getFullYear();
      const startMonth = new Date(expense.startDate).getMonth();
      year = monthIndex < startMonth ? startYear + 1 : startYear;
      console.log(`  Start year: ${startYear}, start month: ${startMonth}, calculated year: ${year}`);
    } else {
      year = 2027; // Default
      console.log(`  Using default year: ${year}`);
    }
    
    const dateObj = new Date(year, monthIndex, parseInt(day));
    console.log(`  Final date: ${dateObj.toLocaleDateString()}`);
  } else {
    console.log(`  Skipping - not a one-off expense or no payment schedule`);
  }
}); 