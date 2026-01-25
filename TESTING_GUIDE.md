# Testing Guide - TripOptimizer

**Last Updated**: 2026-01-24
**Status**: Ready for Testing

This guide provides step-by-step instructions for testing TripOptimizer.

---

## Quick Start

### 1. Prerequisites

```bash
# Make sure dependencies are installed
npm install

# Make sure database is running
# PostgreSQL should be running on localhost:5432

# Make sure .env is configured
cp .env.example .env
# Edit .env with your database credentials
```

### 2. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 3. Start Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

Server should start on: http://localhost:3000

---

## API Endpoint Testing

### Health Check

```bash
# Test server is running
curl http://localhost:3000/

# Expected response:
{
  "name": "TripOptimizer API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

### Phase 1: AI Agent Testing

#### 1. Test Parsing Agent

```bash
curl -X POST http://localhost:3000/parse/booking \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Dear John Smith, Your reservation is confirmed! Booking Reference: BA12345 Hotel: Grand Hotel Barcelona Check-in: March 15, 2026 Check-out: March 22, 2026",
    "documentTypeHint": "EMAIL"
  }'
```

**Expected**: Structured booking data extracted

#### 2. Test Verification Agent

```bash
curl -X POST http://localhost:3000/verify/entity \
  -H "Content-Type: application/json" \
  -d '{
    "entityName": "Grand Hotel Barcelona",
    "entityType": "HOTEL",
    "city": "Barcelona",
    "country": "Spain"
  }'
```

**Expected**: Verification status (VERIFIED/UNVERIFIED/UNKNOWN)

### Phase 2: Booking System Testing

#### 1. Generate Trip Options

```bash
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "originCity": "New York",
    "destination": "Barcelona",
    "startDate": "2026-06-01",
    "endDate": "2026-06-08",
    "numberOfDays": 7,
    "budgetTotal": 200000,
    "travelStyle": "BALANCED"
  }'
```

**Expected**: 3 trip options with flights, hotels, activities

**Save the tripOptionId from response for next steps**

#### 2. Test Booking (Mock Mode)

```bash
# Make sure MOCK_STRIPE=true in .env

curl -X POST http://localhost:3000/booking/book \
  -H "Content-Type: application/json" \
  -d '{
    "tripOptionId": "YOUR_TRIP_OPTION_ID_HERE",
    "paymentInfo": {
      "paymentMethodId": "pm_test_mock",
      "billingDetails": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address": {
          "line1": "123 Main St",
          "city": "New York",
          "state": "NY",
          "postalCode": "10001",
          "country": "US"
        }
      },
      "amount": 200000,
      "currency": "USD"
    },
    "userContact": {
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  }'
```

**Expected**: Booking confirmation with all component confirmations

---

## Integration Testing

### Full Booking Flow

```bash
#!/bin/bash

echo "=== TripOptimizer Full Booking Flow Test ==="

# Step 1: Generate trip options
echo "\n1. Generating trip options..."
TRIP_RESPONSE=$(curl -s -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{
    "originCity": "New York",
    "destination": "Barcelona",
    "startDate": "2026-06-01",
    "endDate": "2026-06-08",
    "numberOfDays": 7,
    "budgetTotal": 200000,
    "travelStyle": "BALANCED"
  }')

# Extract first trip option ID
TRIP_OPTION_ID=$(echo $TRIP_RESPONSE | jq -r '.options[0].id')
echo "Trip Option ID: $TRIP_OPTION_ID"

# Step 2: Book the trip
echo "\n2. Booking trip..."
BOOKING_RESPONSE=$(curl -s -X POST http://localhost:3000/booking/book \
  -H "Content-Type: application/json" \
  -d "{
    \"tripOptionId\": \"$TRIP_OPTION_ID\",
    \"paymentInfo\": {
      \"paymentMethodId\": \"pm_test_mock\",
      \"billingDetails\": {
        \"name\": \"John Doe\",
        \"email\": \"john@example.com\"
      },
      \"amount\": 200000,
      \"currency\": \"USD\"
    }
  }")

echo "Booking Result:"
echo $BOOKING_RESPONSE | jq .

# Step 3: Verify in database
echo "\n3. Checking database..."
echo "Run: npx prisma studio"
echo "Check tables: Booking, Payment, TripOption"
```

---

## Database Testing

### Check Data in Prisma Studio

```bash
# Open Prisma Studio
npx prisma studio

# Check these tables:
# - TripRequest: Should have your trip request
# - TripOption: Should have 3 options
# - FlightOption: Should have flight details
# - HotelOption: Should have hotel details
# - Booking: Should have booking records (after booking)
# - Payment: Should have payment records (after booking)
```

### SQL Queries

```sql
-- Check trip requests
SELECT id, "originCity", destination, "budgetTotal", "createdAt"
FROM "TripRequest"
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check trip options
SELECT id, destination, "totalCost", "remainingBudget", score
FROM "TripOption"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check bookings
SELECT id, "bookingType", status, "vendorConfirmation", "createdAt"
FROM "Booking"
ORDER BY "createdAt" DESC;

-- Check payments
SELECT id, "paymentIntentId", amount, currency, status, "createdAt"
FROM "Payment"
ORDER BY "createdAt" DESC;
```

---

## Error Scenario Testing

### 1. Test Payment Failure

```bash
# If using real Stripe, use decline test card
curl -X POST http://localhost:3000/booking/book \
  -H "Content-Type: application/json" \
  -d '{
    "tripOptionId": "YOUR_TRIP_OPTION_ID",
    "paymentInfo": {
      "paymentMethodId": "pm_card_visa_chargeDeclined",
      "billingDetails": { "name": "Test", "email": "test@example.com" },
      "amount": 200000,
      "currency": "USD"
    }
  }'
```

**Expected**: Booking fails with payment error, no data saved

### 2. Test Invalid Trip Option

```bash
curl -X POST http://localhost:3000/booking/book \
  -H "Content-Type: application/json" \
  -d '{
    "tripOptionId": "invalid-uuid",
    "paymentInfo": { ... }
  }'
```

**Expected**: Error message about trip option not found

### 3. Test Missing Required Fields

```bash
curl -X POST http://localhost:3000/booking/book \
  -H "Content-Type: application/json" \
  -d '{
    "tripOptionId": "YOUR_TRIP_OPTION_ID"
  }'
```

**Expected**: Error about missing payment information

---

## Performance Testing

### Load Test (using Apache Bench)

```bash
# Install Apache Bench
brew install httpd  # macOS

# Test trip generation endpoint (10 concurrent, 100 total)
ab -n 100 -c 10 -p trip-request.json -T application/json \
  http://localhost:3000/trip/generate

# Where trip-request.json contains:
{
  "originCity": "New York",
  "destination": "Barcelona",
  "startDate": "2026-06-01",
  "endDate": "2026-06-08",
  "numberOfDays": 7,
  "budgetTotal": 200000,
  "travelStyle": "BALANCED"
}
```

**Target**: < 3 seconds average response time

---

## AI Agent Boundary Testing

### Verify AI is NOT used for deterministic logic

```bash
# Enable AI audit logging
export ENABLE_AI_AUDIT=true

# Generate trip
curl -X POST http://localhost:3000/trip/generate \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# Check logs for AI calls
# Should see ONLY:
# - Activity Discovery Agent (1 call)
# - Itinerary Composition Agent (3 calls, one per option)

# Should NOT see AI calls for:
# - Budget allocation
# - Scoring/ranking
# - Activity selection
```

---

## Mock vs Real API Testing

### Mock Mode (Default)

```bash
# In .env:
MOCK_CLAUDE=true
MOCK_STRIPE=true

# All APIs use mock implementations
# Good for development and testing
```

### Real API Mode

```bash
# In .env:
MOCK_CLAUDE=false
ANTHROPIC_API_KEY=sk-ant-...

MOCK_STRIPE=false
STRIPE_SECRET_KEY=sk_test_...

# APIs use real services
# Costs money, use for final testing
```

---

## Monitoring & Logging

### Check Application Logs

```bash
# Watch logs in real-time
npm run dev | grep -E "(ERROR|BookingOrchestrator|AI AGENT)"

# Look for:
# - [BookingOrchestrator] messages
# - [AI AGENT AUDIT] messages
# - ERROR messages
```

### Check Stripe Dashboard

```bash
# View payments in Stripe Dashboard:
https://dashboard.stripe.com/test/payments

# Check:
# - Payment intents created
# - Successful charges
# - Refunds (if rollback occurred)
```

---

## Troubleshooting

### Server Won't Start

```bash
# Check if port is already in use
lsof -ti:3000 | xargs kill -9

# Check if database is running
psql -U postgres -h localhost -p 5432 -c "SELECT version();"

# Check environment variables
cat .env | grep -E "(DATABASE_URL|PORT)"
```

### Database Connection Errors

```bash
# Reset database
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate

# Check connection
npx prisma db pull
```

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### TypeScript Errors

```bash
# Check for errors
npx tsc --noEmit

# Generate Prisma types
npx prisma generate
```

---

## Automated Testing (TODO)

### Unit Tests

```bash
# Run unit tests (when implemented)
npm test

# Run specific test file
npm test -- booking-orchestrator.test.ts

# Run with coverage
npm test -- --coverage
```

### Integration Tests

```bash
# Run integration tests (when implemented)
npm run test:integration

# Test categories:
# - Booking flow
# - Payment processing
# - Rollback logic
# - AI agent boundaries
```

---

## Test Checklist

### Before Production

- [ ] Server starts without errors
- [ ] All endpoints return expected responses
- [ ] Trip generation works (3 options returned)
- [ ] Booking succeeds in mock mode
- [ ] Booking fails gracefully with invalid data
- [ ] Payment refund works on booking failure
- [ ] Database records are created correctly
- [ ] AI boundaries are respected (audit log)
- [ ] Error messages are user-friendly
- [ ] Performance is acceptable (< 3s response time)

### With Real APIs

- [ ] Stripe payment succeeds
- [ ] Stripe refund works
- [ ] Amadeus flight search returns results (when implemented)
- [ ] Hotel search returns results (when implemented)
- [ ] Full booking flow completes successfully
- [ ] Rollback works on API failures

---

## Support

If you encounter issues:

1. Check logs for error messages
2. Verify environment variables are correct
3. Check database connection
4. Review [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)
5. Check [PROJECT_TRACKER.md](./PROJECT_TRACKER.md) for known issues

---

**Last Updated**: 2026-01-24
**Next Update**: After Phase 3 testing
