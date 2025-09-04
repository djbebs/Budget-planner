import { getMonthlyCalculationDetails } from './src/utils.js';

console.log('Starting test...');

try {
  console.log('Testing with no expenses...');
  const result = getMonthlyCalculationDetails([], '10000', '2500', '1');
  console.log('Result:', result.length, 'months');
  
  if (result.length > 0) {
    console.log('First month:', result[0].monthlySaving);
  }
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}

console.log('Test completed.'); 