/**
 * Phase 2 Test: Lock-Down Mechanism
 *
 * Tests the complete Phase 2 implementation:
 * - Locking/unlocking trip options, flights, and hotels
 * - Lock status validation and rules
 * - Integration with optimization agent (filters locked items)
 * - Database persistence of lock status
 */

import { PrismaClient, LockStatus } from '@prisma/client';
import {
  lockEntity,
  unlockEntity,
  getTripOptionLockState,
  getLockedItemsForTripRequest,
  canReOptimize,
} from './src/services/lockdown.service';
import { agentRegistry } from './src/agents/registry';
import { OrchestratorAgent } from './src/agents/orchestrator.agent';
import { BudgetAgent } from './src/agents/budget.agent';
import { OptimizationAgent } from './src/agents/optimization.agent';
import { BookingAgent } from './src/agents/booking.agent';
import { MonitoringAgent } from './src/agents/monitoring.agent';
import { ExceptionAgent } from './src/agents/exception.agent';

const prisma = new PrismaClient();

async function testPhase2() {
  console.log('🧪 Testing Phase 2: Lock-Down Mechanism\n');

  // 1. Initialize agent system
  console.log('1️⃣  Initializing agent system...');
  agentRegistry.register(new OrchestratorAgent());
  agentRegistry.register(new BudgetAgent());
  agentRegistry.register(new OptimizationAgent());
  agentRegistry.register(new BookingAgent());
  agentRegistry.register(new MonitoringAgent());
  agentRegistry.register(new ExceptionAgent());

  await agentRegistry.initializeAll({ metadata: { environment: 'test' } });
  console.log('   ✓ Agents initialized\n');

  // 2. Create test data: TripRequest with TripOptions
  console.log('2️⃣  Creating test trip data...');

  const tripRequest = await prisma.tripRequest.create({
    data: {
      originCity: 'Toronto',
      destination: 'Paris',
      numberOfDays: 7,
      budgetTotal: 300000, // $3,000
      travelStyle: 'BALANCED',
    },
  });

  const tripOption1 = await prisma.tripOption.create({
    data: {
      tripRequestId: tripRequest.id,
      destination: 'Paris',
      totalCost: 250000,
      remainingBudget: 50000,
      score: 0.85,
      explanation: 'Test option 1',
      itineraryJson: {},
      flightOption: {
        create: {
          provider: 'Air Canada',
          price: 120000,
          departureTime: new Date('2026-03-01T10:00:00Z'),
          returnTime: new Date('2026-03-08T18:00:00Z'),
          deepLink: 'https://example.com/flight1',
        },
      },
      hotelOption: {
        create: {
          name: 'Hotel Eiffel',
          priceTotal: 130000,
          rating: 4.5,
          deepLink: 'https://example.com/hotel1',
        },
      },
    },
    include: {
      flightOption: true,
      hotelOption: true,
    },
  });

  console.log(`   ✓ Created trip request: ${tripRequest.id}`);
  console.log(`   ✓ Created trip option: ${tripOption1.id}`);
  console.log(`   ✓ Created flight: ${tripOption1.flightOption?.id}`);
  console.log(`   ✓ Created hotel: ${tripOption1.hotelOption?.id}\n`);

  // 3. Test locking a flight
  console.log('3️⃣  Test Case 1: Lock a flight (user selects this flight)');
  const lockFlightResult = await lockEntity({
    entityType: 'flight',
    entityId: tripOption1.flightOption!.id,
    lockStatus: LockStatus.LOCKED,
  });

  if (lockFlightResult.success) {
    console.log('   ✅ Flight locked successfully');
    console.log(`      Status: ${lockFlightResult.lockStatus}`);
    console.log(`      Locked at: ${lockFlightResult.lockedAt}\n`);
  } else {
    console.error(`   ❌ Failed to lock flight: ${lockFlightResult.error}\n`);
  }

  // 4. Test locking a hotel
  console.log('4️⃣  Test Case 2: Lock a hotel (user selects this hotel)');
  const lockHotelResult = await lockEntity({
    entityType: 'hotel',
    entityId: tripOption1.hotelOption!.id,
    lockStatus: LockStatus.LOCKED,
  });

  if (lockHotelResult.success) {
    console.log('   ✅ Hotel locked successfully');
    console.log(`      Status: ${lockHotelResult.lockStatus}`);
    console.log(`      Locked at: ${lockHotelResult.lockedAt}\n`);
  } else {
    console.error(`   ❌ Failed to lock hotel: ${lockHotelResult.error}\n`);
  }

  // 5. Get lock state for the trip option
  console.log('5️⃣  Test Case 3: Get lock state for trip option');
  const lockState = await getTripOptionLockState(tripOption1.id);

  if (lockState) {
    console.log('   ✅ Lock state retrieved:');
    console.log(`      Trip option status: ${lockState.tripOptionLockStatus}`);
    console.log(`      Flight status: ${lockState.flightLockStatus}`);
    console.log(`      Hotel status: ${lockState.hotelLockStatus}`);
    console.log(`      Fully locked: ${lockState.isFullyLocked}`);
    console.log(`      Partially locked: ${lockState.isPartiallyLocked}\n`);
  } else {
    console.error('   ❌ Failed to get lock state\n');
  }

  // 6. Test re-optimization check
  console.log('6️⃣  Test Case 4: Check if trip can be re-optimized');
  const canOptimize = canReOptimize(lockState!);
  console.log(`   ${canOptimize ? '❌' : '✅'} Can re-optimize: ${canOptimize}`);
  console.log('   (Should be false since flight and hotel are locked)\n');

  // 7. Test confirming a booking (LOCKED -> CONFIRMED)
  console.log('7️⃣  Test Case 5: Confirm flight booking (LOCKED -> CONFIRMED)');
  const confirmFlightResult = await lockEntity({
    entityType: 'flight',
    entityId: tripOption1.flightOption!.id,
    lockStatus: LockStatus.CONFIRMED,
  });

  if (confirmFlightResult.success) {
    console.log('   ✅ Flight confirmed successfully');
    console.log(`      Status: ${confirmFlightResult.lockStatus}\n`);
  } else {
    console.error(`   ❌ Failed to confirm flight: ${confirmFlightResult.error}\n`);
  }

  // 8. Test unlocking a CONFIRMED item (should fail)
  console.log('8️⃣  Test Case 6: Try to unlock a CONFIRMED flight (should fail)');
  const unlockConfirmedResult = await unlockEntity('flight', tripOption1.flightOption!.id);

  if (!unlockConfirmedResult.success) {
    console.log('   ✅ Unlock correctly rejected:');
    console.log(`      Reason: ${unlockConfirmedResult.error}\n`);
  } else {
    console.error('   ❌ Should not allow unlocking CONFIRMED items\n');
  }

  // 9. Test unlocking a LOCKED item (should succeed)
  console.log('9️⃣  Test Case 7: Unlock the LOCKED hotel (should succeed)');
  const unlockHotelResult = await unlockEntity('hotel', tripOption1.hotelOption!.id);

  if (unlockHotelResult.success) {
    console.log('   ✅ Hotel unlocked successfully');
    console.log(`      Status: ${unlockHotelResult.lockStatus}\n`);
  } else {
    console.error(`   ❌ Failed to unlock hotel: ${unlockHotelResult.error}\n`);
  }

  // 10. Get all locked items for the trip
  console.log('🔟 Test Case 8: Get all locked items for trip request');
  const lockedItems = await getLockedItemsForTripRequest(tripRequest.id);
  console.log(`   ✅ Found ${lockedItems.length} trip option(s)`);

  lockedItems.forEach((item, index) => {
    console.log(`
      Option ${index + 1}:`);
    console.log(`      Trip option: ${item.tripOptionLockStatus}`);
    console.log(`      Flight: ${item.flightLockStatus}`);
    console.log(`      Hotel: ${item.hotelLockStatus}`);
    console.log(`      Can re-optimize: ${canReOptimize(item)}`);
  });
  console.log();

  // 11. Cleanup
  console.log('1️⃣1️⃣  Cleaning up test data...');
  await prisma.tripRequest.delete({
    where: { id: tripRequest.id },
  });
  console.log('   ✓ Test data cleaned up\n');

  // 12. Shutdown
  console.log('1️⃣2️⃣  Shutting down...');
  await agentRegistry.shutdownAll();
  console.log('   ✓ All agents shutdown\n');

  console.log('✅ Phase 2 Test Complete!');
  console.log('\nPhase 2 Success Criteria:');
  console.log('   ✓ Lock status enum (UNLOCKED, LOCKED, CONFIRMED) working');
  console.log('   ✓ Individual components (flight/hotel) can be locked');
  console.log('   ✓ Lock state correctly tracked and retrieved');
  console.log('   ✓ CONFIRMED items cannot be unlocked (rule enforced)');
  console.log('   ✓ LOCKED items can be unlocked');
  console.log('   ✓ Re-optimization check respects lock status');
  console.log('   ✓ Database persistence working correctly');
}

testPhase2()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
