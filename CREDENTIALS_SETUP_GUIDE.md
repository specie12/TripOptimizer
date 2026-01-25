# API Credentials Setup Guide

**Purpose**: Step-by-step guide to get all API credentials for testing TripOptimizer with real APIs

**Estimated Time**: 30-45 minutes total

---

## Priority Order (Get These First)

### ⭐ Priority 1: Essential for Basic Testing (FREE)
1. **Stripe Test Mode** (5 minutes) - Payment processing
2. **Amadeus Test API** (15 minutes) - Flight search & booking

### Priority 2: Optional for Full Testing (FREE Tiers Available)
3. **RapidAPI** (10 minutes) - Hotel search
4. **Claude AI** (5 minutes) - Activity discovery & itinerary generation

### Priority 3: Future Enhancements
5. Viator/GetYourGuide - Direct activity booking (requires approval)
6. Booking.com Partnership - Direct hotel booking (requires approval)

---

## 1. Stripe Test Mode (Priority 1) ⭐

**Cost**: FREE (test mode forever)
**Time**: 5 minutes
**Required For**: Payment processing

### Step-by-Step:

1. **Sign Up**:
   - Go to: https://stripe.com
   - Click "Start now" or "Sign up"
   - Enter email, create account
   - **Skip business verification** (not needed for test mode)

2. **Get Test API Keys**:
   - After login, you'll be in **Test mode** by default (check toggle in top-right)
   - Go to: **Developers → API keys**
   - You'll see:
     - **Publishable key**: `pk_test_...` (not needed for backend)
     - **Secret key**: `sk_test_...` ✅ **COPY THIS**
   - Click "Reveal test key" and copy the secret key

3. **Get Webhook Secret** (optional for now):
   - Go to: **Developers → Webhooks**
   - Click "Add endpoint"
   - Endpoint URL: `http://localhost:3000/webhooks/stripe` (or skip for now)
   - Copy webhook secret: `whsec_...`

4. **Update `.env`**:
   ```bash
   MOCK_STRIPE=false
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   # STRIPE_WEBHOOK_SECRET=whsec_...  # Optional for now
   ```

5. **Test Card Numbers** (use these for testing):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)

**Done!** ✅ You can now process test payments.

---

## 2. Amadeus Flight API (Priority 1) ⭐

**Cost**: FREE for testing (10 transactions/month in test mode)
**Time**: 15 minutes
**Required For**: Real flight search and booking

### Step-by-Step:

1. **Sign Up**:
   - Go to: https://developers.amadeus.com/register
   - Click "Register"
   - Fill in:
     - Email
     - Password
     - First/Last Name
     - Country
     - Accept terms
   - Verify email

2. **Create Test App**:
   - After login, go to: **My Apps**
   - Click "Create New App"
   - Fill in:
     - **App Name**: `TripOptimizer Test`
     - **Description**: `Travel planning app for testing`
     - **Select APIs**: Choose "Flight Offers Search" and "Flight Create Orders"
   - Click "Create"

3. **Get API Credentials**:
   - Click on your new app
   - You'll see:
     - **API Key**: Long alphanumeric string ✅ **COPY THIS**
     - **API Secret**: Another long string ✅ **COPY THIS**
   - Make sure you're on **Test environment** (check dropdown)

4. **Update `.env`**:
   ```bash
   MOCK_AMADEUS=false
   AMADEUS_API_KEY=YOUR_API_KEY_HERE
   AMADEUS_API_SECRET=YOUR_API_SECRET_HERE
   AMADEUS_ENVIRONMENT=test
   ```

5. **Rate Limits** (Test Mode):
   - 1 transaction per second
   - 10 transactions per month (free tier)
   - Upgrade to paid plan for more (not needed for testing)

**Done!** ✅ You can now search and book real flights (in test mode).

**Important Notes**:
- Test mode flights are NOT real bookings
- You won't be charged anything
- Perfect for development and testing
- For production, switch to `AMADEUS_ENVIRONMENT=production` (requires paid plan)

---

## 3. RapidAPI for Hotel Search (Priority 2)

**Cost**: FREE tier (500 requests/month)
**Time**: 10 minutes
**Required For**: Real hotel search data

### Step-by-Step:

1. **Sign Up**:
   - Go to: https://rapidapi.com
   - Click "Sign Up"
   - Use Google/GitHub or email signup

2. **Subscribe to Booking.com API**:
   - Go to: https://rapidapi.com/apidojo/api/booking
   - Click "Subscribe to Test" (FREE tier)
   - Select **Basic** plan (500 requests/month, $0)
   - Click "Subscribe"

3. **Get API Key**:
   - After subscribing, scroll to "Code Snippets"
   - You'll see: `X-RapidAPI-Key: YOUR_KEY_HERE` ✅ **COPY THIS**
   - And: `X-RapidAPI-Host: booking-com.p.rapidapi.com`

4. **Update `.env`**:
   ```bash
   MOCK_HOTELS=false
   RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY_HERE
   RAPIDAPI_HOTELS_HOST=booking-com.p.rapidapi.com
   ```

**Done!** ✅ You can now search real hotel data.

**Important Notes**:
- This API only provides hotel **search** data
- Booking is still done via deep links (user completes on Booking.com)
- For direct booking, need Booking.com partnership (harder to get)

---

## 4. Claude AI API (Priority 2)

**Cost**: FREE credits for new users ($5 credit)
**Time**: 5 minutes
**Required For**: Activity discovery, itinerary generation, parsing

### Step-by-Step:

1. **Sign Up**:
   - Go to: https://console.anthropic.com
   - Click "Sign Up"
   - Use email or Google signup
   - Verify email

2. **Get API Key**:
   - After login, go to: **API Keys**
   - Click "Create Key"
   - Name: `TripOptimizer Dev`
   - Copy the key: `sk-ant-...` ✅ **COPY THIS**
   - **Save it now** (you won't be able to see it again)

3. **Update `.env`**:
   ```bash
   MOCK_CLAUDE=false
   ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
   ```

4. **Pricing** (Pay-as-you-go):
   - Claude Haiku: $0.80 per million tokens (very cheap)
   - $5 free credit = ~6 million tokens of Haiku
   - Plenty for extensive testing

**Done!** ✅ You can now use AI agents for real.

---

## Summary Checklist

Use this checklist as you get credentials:

- [ ] **Stripe Test Key** - `sk_test_...`
- [ ] **Amadeus API Key** - From developers.amadeus.com
- [ ] **Amadeus API Secret** - From developers.amadeus.com
- [ ] **RapidAPI Key** - From rapidapi.com (optional)
- [ ] **Claude API Key** - `sk-ant-...` (optional)

---

## Updated `.env` File

After getting all credentials, your `.env` should look like:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/tripoptimizer"

# Server
PORT=3000

# Claude AI API (Priority 2)
MOCK_CLAUDE=false
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE

# Amadeus Flight API (Priority 1) ⭐
MOCK_AMADEUS=false
AMADEUS_API_KEY=YOUR_API_KEY_HERE
AMADEUS_API_SECRET=YOUR_API_SECRET_HERE
AMADEUS_ENVIRONMENT=test

# Stripe Payment API (Priority 1) ⭐
MOCK_STRIPE=false
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
# STRIPE_WEBHOOK_SECRET=whsec_...  # Optional

# Hotel Search API (Priority 2)
MOCK_HOTELS=false
RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY_HERE
RAPIDAPI_HOTELS_HOST=booking-com.p.rapidapi.com

# Activity Booking API (can stay in mock mode for now)
MOCK_ACTIVITIES=true
```

---

## Testing Order

Once you have credentials:

### Phase 1: Test Individual APIs
1. Test Stripe payment (5 min)
2. Test Amadeus flight search (5 min)
3. Test RapidAPI hotel search (5 min)
4. Test Claude AI agents (5 min)

### Phase 2: Test Trip Generation
1. Generate trip with real APIs (10 min)
2. Verify real flight/hotel data

### Phase 3: Test End-to-End Booking
1. Book trip with real Stripe payment (15 min)
2. Verify all confirmations

**Total Testing Time**: ~45 minutes

---

## Troubleshooting

### Stripe Errors
- **"Invalid API key"**: Make sure key starts with `sk_test_`
- **"Rate limited"**: Wait a minute and try again

### Amadeus Errors
- **"Invalid credentials"**: Check API Key and Secret are correct
- **"Quota exceeded"**: You hit 10 transactions/month limit
  - Solution: Create new test app or wait for monthly reset

### RapidAPI Errors
- **"Invalid subscription"**: Make sure you subscribed to FREE plan
- **"Rate limited"**: Wait for next month or upgrade plan

### Claude AI Errors
- **"Invalid API key"**: Make sure key starts with `sk-ant-`
- **"Insufficient credits"**: Add payment method or wait

---

## Cost Summary

**For Testing** (what you need now):
- Stripe: **$0** (test mode forever)
- Amadeus: **$0** (10 test transactions/month)
- RapidAPI: **$0** (500 requests/month)
- Claude AI: **$0** ($5 free credit)

**Total**: **$0** for extensive testing

**For Production** (later):
- Stripe: 2.9% + $0.30 per transaction
- Amadeus: ~$0.10 per flight search
- RapidAPI: $10-50/month
- Claude AI: Pay-as-you-go (~$0.80 per million tokens)

---

## Next Steps

After getting credentials:
1. Update `.env` file
2. Restart backend server: `npm run dev`
3. Run test suite (I'll guide you)
4. Test end-to-end booking flow

---

**Questions?** Ask anytime during setup!
