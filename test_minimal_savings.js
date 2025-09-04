// Test: Verify Global Timespan Algorithm with Minimal Post-Payment Savings

const { getMonthlyCalculationDetails } = require('./src/utils.js');

console.log('🧪 Testing Global Timespan Algorithm with Minimal Post-Payment Savings');

// Test scenario: Similar to user's data
const expenses = [
  {
    description: "One-off Payment 1",
    amount: "10000",
    recurrence: "One-off",
    paymentSchedule: "01.01",
    startDate: "2026-01-01",
    endDate: "2026-12-31"
  },
  {
    description: "One-off Payment 2", 
    amount: "15000",
    recurrence: "One-off",
    paymentSchedule: "01.01",
    startDate: "2027-01-01",
    endDate: "2027-12-31"
  }
];

const currentAmount = 20000;
const targetAmount = 1000;
const adjustmentCycleYears = 1;

console.log('\n📊 Test Parameters:');
console.log(`Starting Balance: CHF ${currentAmount}`);
console.log(`Target Balance: CHF ${targetAmount}`);
console.log('One-off payments: CHF 10,000 (2026) + CHF 15,000 (2027)');

const results = getMonthlyCalculationDetails(expenses, currentAmount, targetAmount, adjustmentCycleYears);

if (results && results.length > 0) {
  const finalResult = results[results.length - 1];
  console.log('\n✅ Algorithm Results:');
  console.log(`Final Balance (2030): CHF ${finalResult.endBalance.toFixed(2)}`);
  console.log(`Starting Balance: CHF ${currentAmount}`);
  console.log(`Growth: ${((finalResult.endBalance / currentAmount - 1) * 100).toFixed(1)}%`);
  
  // Find periods after last one-off payment
  const lastOneOffIndex = results.findIndex((month, index) => 
    month.hasSignificantExpense && index > 12); // After 2026
  
  if (lastOneOffIndex >= 0) {
    const postPaymentMonths = results.slice(lastOneOffIndex + 1);
    const avgPostPaymentSavings = postPaymentMonths.reduce((sum, month) => sum + month.monthlySaving, 0) / postPaymentMonths.length;
    
    console.log(`\n🎯 Post-Payment Analysis:`);
    console.log(`Last one-off payment: Month ${lastOneOffIndex + 1}`);
    console.log(`Avg savings after last payment: CHF ${avgPostPaymentSavings.toFixed(2)}/month`);
    console.log(`Expected: CHF 5-15/month (minimal maintenance)`);
    
    // Verification
    if (finalResult.endBalance < 50000) {
      console.log('✅ SUCCESS: Final balance reasonable (< CHF 50,000)');
    } else {
      console.log('❌ FAILED: Final balance still too high (> CHF 50,000)');
    }
    
    if (avgPostPaymentSavings < 20) {
      console.log('✅ SUCCESS: Minimal post-payment savings achieved');
    } else {
      console.log('❌ FAILED: Post-payment savings still too high');
    }
  }
} else {
  console.log('❌ ERROR: No results returned from algorithm');
}

console.log('\n�� Test Complete'); 