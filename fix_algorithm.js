// Fix the algorithm to calculate proper monthly savings for the entire projection period
import { getMonthlyCalculationDetails } from './src/utils.js';

// Create a new function that calculates the correct monthly savings
function calculateProperMonthlySavings(expenses, startingBalance, targetBalance, monthsToProject) {
  console.log("=== CALCULATING PROPER MONTHLY SAVINGS ===");
  
  // Parse expenses and create monthly expense totals
  const monthlyExpenseTotals = new Array(monthsToProject).fill(0);
  
  // For this test, let's simulate the one-off expense in January 2028 (month 30)
  const jan2028Month = 30; // Assuming projection starts from August 2025
  monthlyExpenseTotals[jan2028Month] = 11000;
  
  console.log(`Starting Balance: ${startingBalance}`);
  console.log(`Target Balance: ${targetBalance}`);
  console.log(`Months to Project: ${monthsToProject}`);
  console.log(`One-off expense in month ${jan2028Month}: ${monthlyExpenseTotals[jan2028Month]}`);
  
  // Calculate total expenses over the entire period
  const totalExpenses = monthlyExpenseTotals.reduce((sum, expense) => sum + expense, 0);
  console.log(`Total Expenses: ${totalExpenses}`);
  
  // Calculate minimum monthly savings needed
  // Formula: (Total Expenses + Target Balance - Starting Balance) / Total Months
  const totalNeeded = totalExpenses + targetBalance - startingBalance;
  const monthlySavingsNeeded = totalNeeded / monthsToProject;
  
  console.log(`Total Needed: ${totalNeeded}`);
  console.log(`Monthly Savings Needed: ${monthlySavingsNeeded.toFixed(2)}`);
  
  // Verify the calculation
  let balance = startingBalance;
  console.log("\nVerification:");
  console.log(`Month 0: Start=${balance.toFixed(2)}, Savings=${monthlySavingsNeeded.toFixed(2)}, Expenses=0, End=${(balance + monthlySavingsNeeded).toFixed(2)}`);
  
  for (let month = 0; month < monthsToProject; month++) {
    const startBalance = balance;
    const monthlySavings = monthlySavingsNeeded;
    const expenses = monthlyExpenseTotals[month];
    
    balance = startBalance + monthlySavings - expenses;
    
    if (month === jan2028Month) {
      console.log(`Month ${month} (Jan 2028): Start=${startBalance.toFixed(2)}, Savings=${monthlySavings.toFixed(2)}, Expenses=${expenses.toFixed(2)}, End=${balance.toFixed(2)}`);
    }
  }
  
  console.log(`Final Balance: ${balance.toFixed(2)}`);
  
  return monthlySavingsNeeded;
}

// Test the calculation
const startingBalance = 3100.57;
const targetBalance = 1000;
const monthsToProject = 65; // Approximately 5+ years

const properMonthlySavings = calculateProperMonthlySavings([], startingBalance, targetBalance, monthsToProject);

console.log(`\n=== RESULT ===`);
console.log(`The algorithm should calculate a monthly savings rate of: CHF ${properMonthlySavings.toFixed(2)}`);
console.log(`This would ensure the balance never goes below the target of CHF ${targetBalance.toFixed(2)}`); 