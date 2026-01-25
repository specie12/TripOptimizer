// Load environment variables
require('dotenv').config();

// Simple test to check if Amadeus API is configured
const { searchFlights } = require('./dist/integrations/amadeus.integration');

async function test() {
  console.log('=== Testing Amadeus API Configuration ===\n');
  console.log('Environment variables:');
  console.log('MOCK_AMADEUS:', process.env.MOCK_AMADEUS);
  console.log('AMADEUS_API_KEY:', process.env.AMADEUS_API_KEY ? 'SET (' + process.env.AMADEUS_API_KEY.substring(0, 15) + '...)' : 'NOT SET');
  console.log('AMADEUS_API_SECRET:', process.env.AMADEUS_API_SECRET ? 'SET (' + process.env.AMADEUS_API_SECRET.substring(0, 10) + '...)' : 'NOT SET');
  console.log('AMADEUS_ENVIRONMENT:', process.env.AMADEUS_ENVIRONMENT);
  console.log('');

  try {
    console.log('Calling searchFlights for YYZ -> BCN...\n');
    const results = await searchFlights({
      originLocationCode: 'YYZ',
      destinationLocationCode: 'BCN',
      departureDate: '2026-04-15',
      returnDate: '2026-04-22',
      adults: 1,
    });

    console.log('✅ SUCCESS! Got', results.length, 'flights');
    console.log('First flight source:', results[0]?.source || 'unknown');
    console.log('First flight airline:', results[0]?.validatingAirlineCodes?.[0] || 'unknown');

    if (results[0]?.source === 'MOCK') {
      console.log('\n⚠️  WARNING: Using MOCK data (not real Amadeus API)');
      console.log('This means either:');
      console.log('1. MOCK_AMADEUS=true in .env');
      console.log('2. Amadeus API credentials are missing/invalid');
      console.log('3. Amadeus API returned an error');
    } else {
      console.log('\n✅ Using REAL Amadeus API data!');
      console.log('Price:', results[0]?.price?.grandTotal);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

test();
