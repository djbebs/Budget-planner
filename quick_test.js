// Quick test to verify binary search algorithm
console.log("=== QUICK BINARY SEARCH TEST ===");

// Simple binary search implementation
function testBinarySearch() {
  const startingBalance = 20000;
  const targetBalance = 3000;
  const monthlyExpenses = [0, 0, 0, 0, 0, 25000, 0, 0, 0, 0, 0, 0]; // Large expense in month 5
  const monthsToProject = 12;
  
  console.log(`Starting Balance: ${startingBalance}`);
  console.log(`Target Balance: ${targetBalance}`);
  console.log(`Large expense: ${monthlyExpenses[5]} in month 5`);
  
  // Binary search
  let minSavings = 0;
  let maxSavings = 30000;
  let requiredMonthlySavings = 0;
  const epsilon = 0.01;
  let iterations = 0;
  const maxIterations = 1000;
  
  console.log("Starting binary search...");
  
  while (maxSavings - minSavings > epsilon && iterations < maxIterations) {
    const testSavings = (minSavings + maxSavings) / 2;
    let testBalance = startingBalance;
    let neverBelowTarget = true;
    
    for (let month = 0; month < monthsToProject; month++) {
      testBalance += testSavings;
      testBalance -= monthlyExpenses[month];
      if (testBalance < targetBalance) {
        neverBelowTarget = false;
        break;
      }
    }
    
    if (neverBelowTarget) {
      requiredMonthlySavings = testSavings;
      maxSavings = testSavings;
    } else {
      minSavings = testSavings;
    }
    iterations++;
    
    if (iterations % 10 === 0) {
      console.log(`Iteration ${iterations}: min=${minSavings.toFixed(2)}, max=${maxSavings.toFixed(2)}, current=${requiredMonthlySavings.toFixed(2)}`);
    }
  }
  
  console.log(`\nBinary search completed in ${iterations} iterations`);
  console.log(`Required monthly savings: ${requiredMonthlySavings.toFixed(2)}`);
  
  // Verify the result
  let verifyBalance = startingBalance;
  let allAboveTarget = true;
  
  for (let month = 0; month < monthsToProject; month++) {
    verifyBalance += requiredMonthlySavings;
    verifyBalance -= monthlyExpenses[month];
    console.log(`Month ${month + 1}: Balance = ${verifyBalance.toFixed(2)}`);
    if (verifyBalance < targetBalance) {
      allAboveTarget = false;
      console.log(`❌ Month ${month + 1} goes below target!`);
    }
  }
  
  if (allAboveTarget) {
    console.log("✅ SUCCESS: All months maintain balance above target");
  } else {
    console.log("❌ FAILED: Some months go below target");
  }
}

testBinarySearch(); 