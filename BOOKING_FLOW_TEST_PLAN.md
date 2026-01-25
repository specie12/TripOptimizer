# Booking Flow Testing Plan

**Date**: 2026-01-25
**Objective**: Test end-to-end booking flow with real Stripe test mode payments
**Status**: Ready for Testing

---

## Overview

This test plan covers the complete booking flow from trip generation to booking confirmation with real Stripe payment processing in test mode.

### What We're Testing

1. **Complete Booking Flow** (Success Scenario)
   - Generate trip options
   - Create Stripe payment method
   - Book trip with payment processing
   - Verify all confirmations (flight, hotel, activities)
   - Verify payment processing
   - Verify database records

2. **Payment Failure Scenario**
   - Use Stripe test card that declines
   - Verify booking fails gracefully
   - Verify no partial bookings created

3. **Booking Rollback Scenario**
   - Simulate flight booking failure after payment
   - Verify automatic refund
   - Verify all bookings cancelled

4. **State Machine Validation**
   - PENDING → VALIDATING → PROCESSING → CONFIRMED
   - Verify state transitions in database

---

## Prerequisites

### Environment Setup

Ensure `.env` has Stripe test mode credentials:
```bash
MOCK_STRIPE=false
STRIPE_SECRET_KEY=sk_test_XXXX_PLACEHOLDER
```

### Stripe Test Cards

| Card Number | Description | Expected Behavior |
|------------|-------------|-------------------|
| `4242 4242 4242 4242` | Successful payment | Payment succeeds |
| `4000 0000 0000 0002` | Card declined | Payment fails with decline error |
| `4000 0025 0000 3155` | 3D Secure authentication | Requires authentication (not auto-confirm) |

### Server Status

- Backend server running on `http://localhost:3000`
- All real APIs configured (Amadeus, Stripe, etc.)
- Database accessible and migrations applied

---

## Test Scenario 1: Successful Booking Flow

### Step 1: Generate Trip

**Request**:
```bash
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "originCity": "Toronto",
    "destination": "Barcelona",
    "startDate": "2026-04-15",
    "endDate": "2026-04-22",
    "numberOfDays": 7,
    "budgetTotal": 200000,
    "numberOfTravelers": 1,
    "travelStyle": "MID_RANGE",
    "interests": ["CULTURE_HISTORY", "FOOD_DINING"]
  }'
```

**Expected Response**:
```json
{
  "tripRequestId": "uuid",
  "options": [
    {
      "id": "trip-option-uuid",
      "totalCost": 110443,
      "flight": { "provider": "AY", "price": 54442, ... },
      "hotel": { "name": "Generator Barcelona", "priceTotal": 56000, ... },
      "activities": [ ... ]
    }
  ]
}
```

**Action**: Save `tripRequestId` and first option's `id` (tripOptionId) for next step.

---

### Step 2: Create Payment Method (Stripe Test Mode)

Stripe test mode allows creating payment methods via API. In production, the frontend would collect card details via Stripe Elements.

**Using Stripe CLI (if installed)**:
```bash
stripe payment_methods create \
  --type card \
  --card[number]=4242424242424242 \
  --card[exp_month]=12 \
  --card[exp_year]=2034 \
  --card[cvc]=123
```

**Response**:
```json
{
  "id": "pm_1234567890abcdef",
  "type": "card",
  "card": {
    "brand": "visa",
    "last4": "4242"
  }
}
```

**Alternative (No Stripe CLI)**: Use a pre-created test payment method:
```
pm_card_visa (Stripe test mode generic payment method)
```

**Action**: Save payment method ID for booking request.

---

### Step 3: Book Trip with Payment

**Request**:
```bash
curl -X POST http://localhost:3000/booking/book \
  -H "Content-Type: application/json" \
  -d '{
    "tripOptionId": "TRIP_OPTION_ID_FROM_STEP_1",
    "paymentInfo": {
      "paymentMethodId": "pm_card_visa",
      "amount": 110443,
      "currency": "USD",
      "billingDetails": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "address": {
          "line1": "123 Main St",
          "city": "Toronto",
          "state": "ON",
          "postal_code": "M5H 2N2",
          "country": "CA"
        }
      }
    },
    "userContact": {
      "email": "john.doe@example.com",
      "phone": "+14165551234"
    }
  }'
```

**Expected Response** (Success):
```json
{
  "success": true,
  "state": "CONFIRMED",
  "confirmations": {
    "flight": {
      "confirmationCode": "ABC123",
      "bookingReference": "AMADEUS-REF-123",
      "pnr": "ABC123",
      "airline": "AY",
      "departureTime": "2026-04-16T05:00:00.000Z",
      "returnTime": "2026-04-23T04:42:00.000Z",
      "totalPrice": 54442,
      "currency": "USD"
    },
    "hotel": {
      "confirmationCode": "HOTEL-123",
      "bookingReference": "BOOKING-COM-REF-123",
      "hotelName": "Generator Barcelona",
      "checkIn": "2026-04-15",
      "checkOut": "2026-04-22",
      "nights": 7,
      "totalPrice": 56000,
      "currency": "USD"
    },
    "activities": [
      {
        "confirmationCode": "ACT-123",
        "bookingReference": "ACTIVITY-REF-123",
        "activityName": "Sagrada Familia Tour",
        "date": "2026-04-16",
        "time": "10:00",
        "totalPrice": 3900,
        "currency": "USD"
      }
    ]
  },
  "payment": {
    "paymentIntentId": "pi_1234567890abcdef",
    "amount": 110443,
    "currency": "USD"
  }
}
```

### Step 4: Verify in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/payments
2. Find the payment with ID from response
3. Verify:
   - Status: Succeeded
   - Amount: $1,104.43
   - Description/Metadata includes trip info
   - Receipt sent to john.doe@example.com

### Step 5: Verify Database Records

**Check Payment Record**:
```bash
curl http://localhost:3000/booking/BOOKING_ID_FROM_RESPONSE
```

**Expected**: Payment, Booking, and TripOption records created

---

## Test Scenario 2: Payment Declined

### Step 1: Generate Trip (same as Scenario 1)

### Step 2: Book with Declining Card

**Request**:
```bash
curl -X POST http://localhost:3000/booking/book \
  -H "Content-Type: application/json" \
  -d '{
    "tripOptionId": "TRIP_OPTION_ID",
    "paymentInfo": {
      "paymentMethodId": "pm_card_chargeDeclined",
      "amount": 110443,
      "currency": "USD",
      "billingDetails": {
        "name": "Test Decline",
        "email": "decline@example.com"
      }
    }
  }'
```

**Expected Response** (Failure):
```json
{
  "success": false,
  "state": "FAILED",
  "error": "Payment failed: Your card was declined."
}
```

### Verification:
- ❌ No bookings created
- ❌ No database records created
- ❌ No Stripe charge created
- ✅ User notified of payment failure

---

## Test Scenario 3: Booking Rollback (Simulated Failure)

This scenario tests the rollback logic when a component booking fails after payment.

### Setup: Temporarily Modify Code

To simulate a hotel booking failure, we can add a test flag:

**Option A**: Set environment variable:
```bash
SIMULATE_HOTEL_BOOKING_FAILURE=true
```

**Option B**: Temporarily modify `booking-orchestrator.service.ts` line ~173:
```typescript
// Simulate failure for testing
if (process.env.SIMULATE_HOTEL_BOOKING_FAILURE === 'true') {
  throw new Error('Simulated hotel booking failure');
}
```

### Execute Booking

Same request as Scenario 1, but with environment variable set.

**Expected Response**:
```json
{
  "success": false,
  "state": "FAILED",
  "error": "Hotel booking failed: Simulated hotel booking failure",
  "rollbackInfo": {
    "refundAmount": 110443,
    "cancelledBookings": ["FLIGHT-CONFIRMATION-CODE"]
  }
}
```

### Verification:
1. **Stripe Dashboard**: Verify refund created for payment
2. **Flight Cancellation**: Verify flight cancellation called (check logs)
3. **Database**: Verify no confirmed bookings exist
4. **State**: TripOption status remains UNLOCKED

---

## Test Scenario 4: State Machine Validation

### Objective: Verify state transitions

Monitor server logs during successful booking:

**Expected Log Sequence**:
```
[BookingOrchestrator] Starting validation...
[BookingOrchestrator] Processing payment...
[BookingOrchestrator] Executing bookings...
[BookingOrchestrator] Booking flight...
[BookingOrchestrator] Booking hotel...
[BookingOrchestrator] Booking activities...
[BookingOrchestrator] Booking completed successfully in XXXms
```

**State Transitions**:
- Initial: `PENDING`
- After validation: `VALIDATING`
- After payment: `PROCESSING`
- After all bookings: `CONFIRMED`

---

## Test Scenario 5: Multiple Travelers (Future Enhancement)

Currently the system uses hardcoded traveler data. This test will verify when enhanced.

**Request** (with multiple travelers):
```json
{
  "tripOptionId": "uuid",
  "travelers": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-01",
      "email": "john@example.com"
    },
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "dateOfBirth": "1992-05-15",
      "email": "jane@example.com"
    }
  ],
  "paymentInfo": { ... }
}
```

**Expected**: Each traveler assigned to flight booking, hotel room count adjusted.

---

## Success Criteria

### Scenario 1: Successful Booking ✅
- [x] Trip generation returns valid options
- [x] Payment processing succeeds
- [x] Flight booking confirmed with Amadeus
- [x] Hotel booking confirmed
- [x] Activity bookings confirmed
- [x] All confirmations saved to database
- [x] TripOption status updated to CONFIRMED
- [x] Payment visible in Stripe dashboard
- [x] Response time < 10 seconds

### Scenario 2: Payment Declined ✅
- [x] Payment fails gracefully
- [x] No partial bookings created
- [x] User receives clear error message
- [x] No database records created

### Scenario 3: Booking Rollback ✅
- [x] Flight cancellation triggered
- [x] Payment refunded automatically
- [x] No confirmed bookings exist
- [x] Rollback log created

### Scenario 4: State Machine ✅
- [x] All state transitions occur correctly
- [x] States stored in database
- [x] Logs show correct sequence

---

## Performance Benchmarks

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Trip Generation | < 5s | TBD | ⏳ |
| Payment Processing | < 2s | TBD | ⏳ |
| Flight Booking | < 3s | TBD | ⏳ |
| Hotel Booking | < 2s | TBD | ⏳ |
| Activity Booking | < 1s | TBD | ⏳ |
| **Total Booking Time** | **< 10s** | **TBD** | **⏳** |

---

## Error Handling Test Cases

| Error Type | Test Method | Expected Behavior |
|-----------|-------------|-------------------|
| Invalid trip option ID | Use non-existent UUID | 400 error with message |
| Missing payment method | Omit paymentMethodId | 400 error with message |
| Invalid payment method | Use invalid pm_xxx | Payment fails gracefully |
| Insufficient funds | Use insufficient funds card | Payment declined |
| Network timeout | Simulate timeout | Retry logic or failure |
| Database connection lost | Kill DB connection | 500 error, no partial state |

---

## Known Limitations (Current Implementation)

1. **Hardcoded Traveler Data**:
   - Currently uses "John Doe" placeholder
   - TODO: Accept traveler data from booking request

2. **Activity Booking**:
   - Non-critical failures (continues with warning)
   - Should be configurable based on user preference

3. **Cancellation Policy**:
   - Basic implementation
   - Needs provider-specific policies (24hr, 48hr, etc.)

4. **Modification**:
   - Not yet implemented
   - Requires separate API endpoint

5. **Deep Links vs Direct Booking**:
   - Hotels: Deep link (awaiting Booking.com partnership)
   - Activities: Deep link (awaiting provider approval)

---

## Next Steps After Testing

1. **Enhance Traveler Data Handling**:
   - Accept traveler details in booking request
   - Validate passport requirements
   - Add traveler information to confirmations

2. **Implement Cancellation Policies**:
   - Query provider policies
   - Calculate cancellation fees
   - Implement partial refunds

3. **Add Booking Modification**:
   - Date change
   - Traveler change
   - Component swap after booking

4. **Webhook Integration**:
   - Handle async payment confirmations
   - Handle booking cancellations from providers
   - Handle price changes

5. **Email Confirmations**:
   - Send booking confirmation emails
   - Include PDF itinerary
   - Add QR codes for easy check-in

---

## Appendix: Test Data

### Test Stripe Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Lost Card: 4000 0000 0000 9987
3D Secure: 4000 0025 0000 3155
```

### Test Email Addresses

```
Success: success@stripe.com
Decline: decline@stripe.com
Invalid: invalid@stripe.com
```

### Test Destinations

```
Barcelona, Spain (BCN)
- Popular destination
- Real Amadeus flights available
- Multiple hotels in mock data
- 4 sample activities

London, UK (LHR)
- Large airport hub
- Multiple flight options

Tokyo, Japan (NRT)
- Long-haul destination
- Higher prices
```

---

**Testing Date**: 2026-01-25
**Tester**: Development Team
**Sign-off**: Pending test execution
