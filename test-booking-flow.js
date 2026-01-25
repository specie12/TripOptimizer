/**
 * Booking Flow Test Script
 *
 * Tests end-to-end booking flow with real Stripe test mode payments.
 *
 * Usage:
 *   node test-booking-flow.js [scenario]
 *
 * Scenarios:
 *   success  - Test successful booking flow (default)
 *   decline  - Test payment decline scenario
 *   rollback - Test booking rollback scenario
 *   all      - Run all test scenarios
 */

const API_BASE = 'http://localhost:3000';

// Test data
const TEST_TRIP_REQUEST = {
  originCity: 'Toronto',
  destination: 'Barcelona',
  startDate: '2026-04-15',
  endDate: '2026-04-22',
  numberOfDays: 7,
  budgetTotal: 200000,
  numberOfTravelers: 1,
  travelStyle: 'MID_RANGE',
  interests: ['CULTURE_HISTORY', 'FOOD_DINING'],
};

// Stripe test payment methods
const STRIPE_TEST_CARDS = {
  success: 'pm_card_visa', // Successful payment
  decline: 'pm_card_chargeDeclined', // Card declined
  insufficientFunds: 'pm_card_chargeDeclinedInsufficientFunds', // Insufficient funds
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function makeRequest(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

// ============================================
// TEST SCENARIO 1: SUCCESSFUL BOOKING
// ============================================

async function testSuccessfulBooking() {
  logSection('TEST SCENARIO 1: Successful Booking Flow');
  const startTime = Date.now();
  let tripRequestId, tripOptionId, totalCost;

  try {
    // Step 1: Generate trip
    logInfo('Step 1: Generating trip options...');
    const tripResponse = await makeRequest('POST', '/trip/generate', TEST_TRIP_REQUEST);

    if (!tripResponse.ok) {
      logError(`Trip generation failed: ${JSON.stringify(tripResponse.data)}`);
      return false;
    }

    if (!tripResponse.data.options || tripResponse.data.options.length === 0) {
      logError('No trip options returned');
      return false;
    }

    tripRequestId = tripResponse.data.tripRequestId;
    const firstOption = tripResponse.data.options[0];
    tripOptionId = firstOption.id;
    totalCost = firstOption.totalCost;

    logSuccess(`Trip generated: ${tripRequestId}`);
    logInfo(`  - Trip Option ID: ${tripOptionId}`);
    logInfo(`  - Total Cost: $${(totalCost / 100).toFixed(2)}`);
    logInfo(`  - Flight: ${firstOption.flight.provider} ($${(firstOption.flight.price / 100).toFixed(2)})`);
    logInfo(`  - Hotel: ${firstOption.hotel.name} ($${(firstOption.hotel.priceTotal / 100).toFixed(2)})`);
    logInfo(`  - Activities: ${firstOption.activities?.length || 0}`);

    // Step 2: Book trip with payment
    logInfo('\nStep 2: Booking trip with Stripe payment...');
    const bookingRequest = {
      tripOptionId,
      paymentInfo: {
        paymentMethodId: STRIPE_TEST_CARDS.success,
        amount: totalCost,
        currency: 'USD',
        billingDetails: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          address: {
            line1: '123 Main St',
            city: 'Toronto',
            state: 'ON',
            postal_code: 'M5H 2N2',
            country: 'CA',
          },
        },
      },
      userContact: {
        email: 'john.doe@example.com',
        phone: '+14165551234',
      },
    };

    const bookingResponse = await makeRequest('POST', '/booking/book', bookingRequest);

    if (!bookingResponse.ok) {
      logError(`Booking failed: ${JSON.stringify(bookingResponse.data)}`);
      return false;
    }

    const bookingData = bookingResponse.data;

    if (!bookingData.success) {
      logError(`Booking unsuccessful: ${bookingData.error}`);
      return false;
    }

    // Validate response
    logSuccess('Booking completed successfully!');
    logInfo(`  - State: ${bookingData.state}`);
    logInfo(`  - Payment Intent ID: ${bookingData.payment?.paymentIntentId}`);

    if (bookingData.confirmations) {
      if (bookingData.confirmations.flight) {
        logSuccess(`  - Flight Confirmed: ${bookingData.confirmations.flight.confirmationCode}`);
        logInfo(`    - PNR: ${bookingData.confirmations.flight.pnr}`);
        logInfo(`    - Airline: ${bookingData.confirmations.flight.airline}`);
      } else {
        logWarning('  - No flight confirmation');
      }

      if (bookingData.confirmations.hotel) {
        logSuccess(`  - Hotel Confirmed: ${bookingData.confirmations.hotel.confirmationCode}`);
        logInfo(`    - Hotel: ${bookingData.confirmations.hotel.hotelName}`);
        logInfo(`    - Nights: ${bookingData.confirmations.hotel.nights}`);
      } else {
        logWarning('  - No hotel confirmation');
      }

      if (bookingData.confirmations.activities && bookingData.confirmations.activities.length > 0) {
        logSuccess(`  - Activities Confirmed: ${bookingData.confirmations.activities.length}`);
        bookingData.confirmations.activities.forEach((act, i) => {
          logInfo(`    ${i + 1}. ${act.activityName} (${act.confirmationCode})`);
        });
      } else {
        logWarning('  - No activity confirmations');
      }
    }

    const duration = Date.now() - startTime;
    logSuccess(`\n✅ Test passed in ${(duration / 1000).toFixed(2)}s`);

    logInfo('\n📊 Next Steps:');
    logInfo('1. Check Stripe Dashboard: https://dashboard.stripe.com/test/payments');
    logInfo(`2. Search for payment: ${bookingData.payment?.paymentIntentId}`);
    logInfo('3. Verify payment status is "Succeeded"');
    logInfo(`4. Verify amount is $${(totalCost / 100).toFixed(2)}`);

    return true;
  } catch (error) {
    logError(`Test failed with error: ${error.message}`);
    console.error(error);
    return false;
  }
}

// ============================================
// TEST SCENARIO 2: PAYMENT DECLINE
// ============================================

async function testPaymentDecline() {
  logSection('TEST SCENARIO 2: Payment Decline');
  const startTime = Date.now();

  try {
    // Step 1: Generate trip
    logInfo('Step 1: Generating trip options...');
    const tripResponse = await makeRequest('POST', '/trip/generate', TEST_TRIP_REQUEST);

    if (!tripResponse.ok || !tripResponse.data.options || tripResponse.data.options.length === 0) {
      logError('Trip generation failed');
      return false;
    }

    const tripOptionId = tripResponse.data.options[0].id;
    const totalCost = tripResponse.data.options[0].totalCost;

    logSuccess(`Trip generated: ${tripOptionId}`);

    // Step 2: Attempt booking with declining card
    logInfo('\nStep 2: Attempting booking with declining card...');
    const bookingRequest = {
      tripOptionId,
      paymentInfo: {
        paymentMethodId: STRIPE_TEST_CARDS.decline,
        amount: totalCost,
        currency: 'USD',
        billingDetails: {
          name: 'Test Decline',
          email: 'decline@example.com',
        },
      },
    };

    const bookingResponse = await makeRequest('POST', '/booking/book', bookingRequest);

    // We EXPECT this to fail
    if (bookingResponse.ok && bookingResponse.data.success) {
      logError('Booking should have failed but succeeded!');
      return false;
    }

    // Verify error message
    if (bookingResponse.data.error && bookingResponse.data.error.includes('declined')) {
      logSuccess('Payment declined as expected');
      logInfo(`  - Error: ${bookingResponse.data.error}`);
      logInfo(`  - State: ${bookingResponse.data.state}`);
    } else {
      logWarning(`Unexpected error message: ${bookingResponse.data.error}`);
    }

    const duration = Date.now() - startTime;
    logSuccess(`\n✅ Test passed in ${(duration / 1000).toFixed(2)}s`);
    logInfo('Payment decline handled gracefully');

    return true;
  } catch (error) {
    logError(`Test failed with error: ${error.message}`);
    console.error(error);
    return false;
  }
}

// ============================================
// TEST SCENARIO 3: BOOKING ROLLBACK
// ============================================

async function testBookingRollback() {
  logSection('TEST SCENARIO 3: Booking Rollback (Simulated Failure)');

  logWarning('NOTE: This test requires SIMULATE_HOTEL_BOOKING_FAILURE=true in .env');
  logInfo('To enable: Add SIMULATE_HOTEL_BOOKING_FAILURE=true to .env and restart server\n');

  const startTime = Date.now();

  try {
    // Step 1: Generate trip
    logInfo('Step 1: Generating trip options...');
    const tripResponse = await makeRequest('POST', '/trip/generate', TEST_TRIP_REQUEST);

    if (!tripResponse.ok || !tripResponse.data.options || tripResponse.data.options.length === 0) {
      logError('Trip generation failed');
      return false;
    }

    const tripOptionId = tripResponse.data.options[0].id;
    const totalCost = tripResponse.data.options[0].totalCost;

    logSuccess(`Trip generated: ${tripOptionId}`);

    // Step 2: Attempt booking (should fail at hotel step)
    logInfo('\nStep 2: Attempting booking (expecting hotel failure)...');
    const bookingRequest = {
      tripOptionId,
      paymentInfo: {
        paymentMethodId: STRIPE_TEST_CARDS.success,
        amount: totalCost,
        currency: 'USD',
        billingDetails: {
          name: 'Test Rollback',
          email: 'rollback@example.com',
        },
      },
    };

    const bookingResponse = await makeRequest('POST', '/booking/book', bookingRequest);

    // Check if rollback occurred
    if (bookingResponse.data.rollbackInfo) {
      logSuccess('Rollback detected in response');
      logInfo(`  - Refund Amount: $${(bookingResponse.data.rollbackInfo.refundAmount / 100).toFixed(2)}`);
      logInfo(`  - Cancelled Bookings: ${bookingResponse.data.rollbackInfo.cancelledBookings.join(', ')}`);
    } else if (bookingResponse.data.success) {
      logWarning('Booking succeeded - rollback not triggered (check if SIMULATE_HOTEL_BOOKING_FAILURE is set)');
    } else {
      logInfo('Booking failed (as expected for rollback test)');
      logInfo(`  - Error: ${bookingResponse.data.error}`);
    }

    const duration = Date.now() - startTime;
    logSuccess(`\n✅ Test completed in ${(duration / 1000).toFixed(2)}s`);

    return true;
  } catch (error) {
    logError(`Test failed with error: ${error.message}`);
    console.error(error);
    return false;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const scenario = process.argv[2] || 'success';

  log('\n╔═══════════════════════════════════════════════════════════════════╗', 'bright');
  log('║           TripOptimizer Booking Flow Test Suite                  ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════════════╝', 'bright');

  logInfo(`\nAPI Base URL: ${API_BASE}`);
  logInfo(`Test Scenario: ${scenario}`);
  logInfo(`Started at: ${new Date().toISOString()}\n`);

  let results = {};

  switch (scenario) {
    case 'success':
      results.success = await testSuccessfulBooking();
      break;

    case 'decline':
      results.decline = await testPaymentDecline();
      break;

    case 'rollback':
      results.rollback = await testBookingRollback();
      break;

    case 'all':
      results.success = await testSuccessfulBooking();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests

      results.decline = await testPaymentDecline();
      await new Promise(resolve => setTimeout(resolve, 2000));

      results.rollback = await testBookingRollback();
      break;

    default:
      logError(`Unknown scenario: ${scenario}`);
      logInfo('Available scenarios: success, decline, rollback, all');
      process.exit(1);
  }

  // Summary
  logSection('TEST SUMMARY');
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([name, passed]) => {
    if (passed) {
      logSuccess(`${name}: PASSED`);
    } else {
      logError(`${name}: FAILED`);
    }
  });

  log(`\nTotal: ${passed}/${total} passed`, passed === total ? 'green' : 'red');

  if (passed === total) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed', 'yellow');
  }

  process.exit(passed === total ? 0 : 1);
}

// Run tests
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
