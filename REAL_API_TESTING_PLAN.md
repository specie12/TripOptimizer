# Real API Testing Plan

**Purpose**: Systematic testing plan for TripOptimizer with real API credentials

**Prerequisite**: Complete `CREDENTIALS_SETUP_GUIDE.md` first

---

## Testing Environment Setup

### 1. Verify Credentials in `.env`

```bash
# Check your .env file has:
- MOCK_AMADEUS=false
- AMADEUS_API_KEY=...
- AMADEUS_API_SECRET=...
- MOCK_STRIPE=false
- STRIPE_SECRET_KEY=sk_test_...
- MOCK_CLAUDE=false (optional)
- ANTHROPIC_API_KEY=sk-ant-... (optional)
- MOCK_HOTELS=false (optional)
- RAPIDAPI_KEY=... (optional)
```

### 2. Restart Backend Server

```bash
# Stop current server (if running)
pkill -f "node dist/server.js"

# Rebuild with new environment
npm run build

# Start server
npm run dev
```

### 3. Verify Server Started

```bash
curl http://localhost:3000/
# Should return: {"name":"TripOptimizer API","version":"1.0.0",...}
```

---

## Test Suite 1: Individual API Testing

### Test 1.1: Stripe Payment API ✅

**Objective**: Verify Stripe test mode is working

**Test Command**:
```bash
curl -X POST http://localhost:3000/test/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "USD",
    "paymentMethodId": "pm_card_visa"
  }'
```

**Expected Result**:
```json
{
  "success": true,
  "paymentIntentId": "pi_...",
  "status": "succeeded"
}
```

**What This Tests**:
- Stripe API connection
- Payment intent creation
- Test card processing

**Troubleshooting**:
- If error "Invalid API key": Check `STRIPE_SECRET_KEY` in `.env`
- If error "Rate limit": Wait 60 seconds

---

### Test 1.2: Amadeus Flight Search ✅

**Objective**: Verify real flight search works

**Test Command**:
```bash
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "originCity": "New York",
    "destination": "London",
    "startDate": "2026-06-01",
    "endDate": "2026-06-08",
    "budgetTotal": 250000,
    "numberOfTravelers": 1,
    "travelStyle": "MID_RANGE",
    "interests": ["culture"]
  }'
```

**Expected Result**:
```json
{
  "success": true,
  "options": [
    {
      "id": "...",
      "flightOption": {
        "provider": "BA" or "AA" (real airline codes),
        "price": <real price>,
        "departureTime": "2026-06-01T...",
        "returnTime": "2026-06-08T..."
      },
      ...
    }
  ]
}
```

**What This Tests**:
- Amadeus API connection
- Real flight search
- Price filtering
- Flight data parsing

**What to Check**:
- ✅ Flight provider is real airline (not "Mock" or "MOCK")
- ✅ Prices are realistic ($300-$1000 for NYC-London)
- ✅ Flight times are actual schedules
- ✅ Response time < 5 seconds

**Troubleshooting**:
- If error "Invalid credentials": Check Amadeus keys in `.env`
- If error "Quota exceeded": You hit 10 transactions/month limit (create new app)
- If returns mock data: Check `MOCK_AMADEUS=false` in `.env`

---

### Test 1.3: Claude AI Agents (Optional) ✅

**Objective**: Verify AI agents work with real API

**Test Command**:
```bash
curl -X POST http://localhost:3000/test/ai-agents \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Barcelona",
    "dates": {"start": "2026-03-15", "end": "2026-03-22"},
    "interests": ["food", "culture"]
  }'
```

**Expected Result**:
```json
{
  "success": true,
  "activities": [
    {"name": "Sagrada Familia Tour", "category": "cultural", ...},
    {"name": "Tapas Food Tour", "category": "food", ...}
  ]
}
```

**What This Tests**:
- Claude API connection
- Activity discovery agent
- Itinerary composition agent

**Troubleshooting**:
- If error "Invalid API key": Check `ANTHROPIC_API_KEY` in `.env`
- If returns mock data: Check `MOCK_CLAUDE=false` in `.env`

---

## Test Suite 2: Trip Generation with Real APIs

### Test 2.1: Simple Trip Generation ✅

**Objective**: Generate a complete trip with real flight data

**Steps**:

1. **Generate Trip Options**:
```bash
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "originCity": "Toronto",
    "destination": "Barcelona",
    "startDate": "2026-03-15",
    "endDate": "2026-03-22",
    "budgetTotal": 200000,
    "numberOfTravelers": 1,
    "travelStyle": "BALANCED",
    "interests": ["food", "culture", "nightlife"]
  }' > /tmp/trip-real-api.json
```

2. **Review Results**:
```bash
cat /tmp/trip-real-api.json | jq '.options[0]'
```

**What to Verify**:
- ✅ 3 trip options returned
- ✅ Real flight data (check airline codes like "VY", "IB", "BA")
- ✅ Realistic prices
- ✅ Hotels have real names
- ✅ Activities match destination
- ✅ Total cost within budget
- ✅ Response time < 5 seconds

**Save Trip Option ID** for next test:
```bash
export TRIP_OPTION_ID=$(cat /tmp/trip-real-api.json | jq -r '.options[0].id')
echo "Trip Option ID: $TRIP_OPTION_ID"
```

---

### Test 2.2: Complex Trip (Multiple Travelers) ✅

**Objective**: Test with multiple travelers and longer duration

**Test Command**:
```bash
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "originCity": "Los Angeles",
    "destination": "Tokyo",
    "startDate": "2026-04-01",
    "endDate": "2026-04-14",
    "budgetTotal": 800000,
    "numberOfTravelers": 2,
    "travelStyle": "MID_RANGE",
    "interests": ["culture", "food", "adventure"]
  }' | jq '.'
```

**What to Verify**:
- ✅ Prices reflect 2 travelers
- ✅ Hotel rooms accommodate 2 guests
- ✅ Activities support multiple participants
- ✅ Total cost stays within $8,000 budget

---

## Test Suite 3: End-to-End Booking Flow

### Test 3.1: Complete Booking with Real Payment ✅

**Objective**: Book a complete trip with real Stripe payment

**IMPORTANT**: This will create a real Stripe test payment (not charged, but recorded)

**Steps**:

1. **Prepare Booking Request**:
```bash
cat > /tmp/booking-real-api.json << 'EOF'
{
  "tripOptionId": "PASTE_TRIP_OPTION_ID_HERE",
  "paymentInfo": {
    "paymentMethodId": "pm_card_visa",
    "amount": 200000,
    "currency": "USD",
    "billingDetails": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+1234567890",
      "address": {
        "line1": "123 Test St",
        "city": "Toronto",
        "state": "ON",
        "postalCode": "M5H 2N2",
        "country": "CA"
      }
    }
  },
  "userContact": {
    "email": "test@example.com",
    "phone": "+1234567890"
  }
}
EOF
```

2. **Update with Real Trip Option ID**:
```bash
# Use the ID from Test 2.1
sed -i '' "s/PASTE_TRIP_OPTION_ID_HERE/$TRIP_OPTION_ID/" /tmp/booking-real-api.json
```

3. **Execute Booking**:
```bash
curl -X POST http://localhost:3000/booking/book \
  -H "Content-Type: application/json" \
  -d @/tmp/booking-real-api.json \
  > /tmp/booking-confirmation.json

# View result
cat /tmp/booking-confirmation.json | jq '.'
```

**Expected Result**:
```json
{
  "success": true,
  "state": "CONFIRMED",
  "payment": {
    "paymentIntentId": "pi_...",
    "amount": 200000,
    "currency": "USD",
    "status": "succeeded"
  },
  "confirmations": {
    "flight": "FL...",
    "hotel": "HT...",
    "activities": ["AC...", "AC..."]
  }
}
```

**What to Verify**:
- ✅ `success: true`
- ✅ `state: "CONFIRMED"`
- ✅ Payment intent ID starts with `pi_`
- ✅ All confirmation codes generated
- ✅ Response time < 3 seconds

4. **Verify in Stripe Dashboard**:
   - Go to: https://dashboard.stripe.com/test/payments
   - Find your payment (search for $2,000)
   - Status should be "Succeeded"
   - Customer email should be "test@example.com"

5. **Verify in Database**:
```bash
npx ts-node << 'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  const bookings = await prisma.booking.findMany({
    where: { tripOptionId: process.env.TRIP_OPTION_ID },
    select: { bookingType: true, status: true, vendorConfirmation: true }
  });
  console.log('Bookings:', bookings);
  await prisma.$disconnect();
}

verify();
EOF
```

---

### Test 3.2: Booking Failure & Rollback ✅

**Objective**: Test rollback when booking fails

**Test**: Simulate payment failure

```bash
curl -X POST http://localhost:3000/booking/book \
  -H "Content-Type: application/json" \
  -d '{
    "tripOptionId": "'$TRIP_OPTION_ID'",
    "paymentInfo": {
      "paymentMethodId": "pm_card_chargeDeclined",
      "amount": 200000,
      "currency": "USD",
      "billingDetails": {...}
    },
    ...
  }' | jq '.'
```

**Expected Result**:
```json
{
  "success": false,
  "state": "FAILED",
  "error": "Payment declined"
}
```

**What to Verify**:
- ✅ `success: false`
- ✅ `state: "FAILED"`
- ✅ Error message indicates payment failure
- ✅ No bookings created in database

---

## Test Suite 4: API Rate Limits & Error Handling

### Test 4.1: Amadeus Rate Limit ⚠️

**Objective**: Verify graceful fallback when quota exceeded

**Test**: Make 11+ requests in a month (exceeds free tier)

**Expected Behavior**:
- After 10 requests, Amadeus returns error
- System should fallback to mock data automatically
- User should still get trip options (with mock flights)

**Verification**:
```bash
# After 10+ trip generations:
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{"originCity":"NYC","destination":"LAX",...}'

# Check response - should have mock data but still work
```

---

### Test 4.2: Stripe Rate Limit ⚠️

**Objective**: Verify Stripe rate limit handling

**Test**: Make 100+ payment requests per second (unlikely in normal use)

**Expected Behavior**:
- Stripe returns 429 error
- System retries after delay
- User gets error message if retries fail

---

## Test Suite 5: Edge Cases

### Test 5.1: Invalid Destination ✅

```bash
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "originCity": "New York",
    "destination": "NonExistentCity123",
    ...
  }'
```

**Expected**: Error message indicating invalid destination

---

### Test 5.2: Budget Too Low ✅

```bash
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "originCity": "New York",
    "destination": "Tokyo",
    "budgetTotal": 10000,
    ...
  }'
```

**Expected**: Error or no options found (budget insufficient)

---

### Test 5.3: Past Dates ✅

```bash
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "originCity": "New York",
    "destination": "London",
    "startDate": "2020-01-01",
    ...
  }'
```

**Expected**: Error indicating invalid dates

---

## Performance Benchmarks

### Target Metrics:

| Operation | Target Time | Acceptable |
|-----------|-------------|------------|
| Trip Generation | < 3s | < 5s |
| Booking Complete | < 2s | < 3s |
| Payment Processing | < 1s | < 2s |
| Flight Search | < 2s | < 4s |

### How to Measure:

```bash
# Measure trip generation time
time curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d @/tmp/trip-request.json
```

---

## Success Criteria

All tests must pass:

- [ ] Stripe payment processes successfully
- [ ] Amadeus returns real flight data
- [ ] Trip generation completes within 5s
- [ ] Booking completes successfully
- [ ] All confirmations generated
- [ ] Database records created
- [ ] Stripe dashboard shows payment
- [ ] Rollback works on failure
- [ ] Error handling graceful
- [ ] Mock fallback works when APIs fail

---

## Common Issues & Solutions

### Issue: "Invalid API key"
**Solution**: Check `.env` file, restart server

### Issue: "Quota exceeded" (Amadeus)
**Solution**:
1. Create new Amadeus test app
2. Or upgrade to paid plan
3. Or use mock mode for development

### Issue: Real API returns mock data
**Solution**:
1. Verify `MOCK_*=false` in `.env`
2. Restart server after changing `.env`
3. Check API credentials are correct

### Issue: Slow response times
**Solution**:
1. Check internet connection
2. Amadeus test API is slower than mock (2-4s normal)
3. Consider caching for production

---

## Next Steps After Testing

Once all tests pass:

1. **Document Results**: Save test results to `TESTING_RESULTS_REAL_API.md`
2. **Update Frontend**: Connect frontend to real booking flow
3. **Monitor Usage**: Track API usage and costs
4. **Plan Production**: Prepare for production deployment
5. **Move to Phase 3**: Implement PDF itinerary export

---

## Testing Checklist

Use this as you test:

**Setup**:
- [ ] All credentials in `.env`
- [ ] Server restarted
- [ ] Health check passes

**Individual APIs**:
- [ ] Stripe payment works
- [ ] Amadeus flight search works
- [ ] Claude AI works (optional)
- [ ] RapidAPI hotels works (optional)

**Trip Generation**:
- [ ] Simple trip generated
- [ ] Multiple travelers works
- [ ] Real flight data returned
- [ ] Within performance targets

**Booking Flow**:
- [ ] Complete booking succeeds
- [ ] Stripe dashboard shows payment
- [ ] Database records created
- [ ] Rollback works on failure

**Error Handling**:
- [ ] Invalid input handled
- [ ] Rate limits handled
- [ ] Mock fallback works

---

**Ready to Start?** Let me know when you have the credentials and we'll begin testing!
