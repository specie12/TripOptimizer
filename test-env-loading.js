console.log('=== Before dotenv ===');
console.log('MOCK_AMADEUS:', process.env.MOCK_AMADEUS);
console.log('AMADEUS_API_KEY:', process.env.AMADEUS_API_KEY ? 'SET' : 'NOT SET');

console.log('\n=== Loading .env ===');
const result = require('dotenv').config();

if (result.error) {
  console.error('Error loading .env:', result.error);
} else {
  console.log('.env loaded successfully!');
  console.log('Parsed variables:', Object.keys(result.parsed || {}).length);
}

console.log('\n=== After dotenv ===');
console.log('MOCK_AMADEUS:', process.env.MOCK_AMADEUS);
console.log('AMADEUS_API_KEY:', process.env.AMADEUS_API_KEY ? 'SET (' + process.env.AMADEUS_API_KEY.substring(0,15) + '...)' : 'NOT SET');
console.log('MOCK_STRIPE:', process.env.MOCK_STRIPE);
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');
