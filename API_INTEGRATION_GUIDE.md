# API Integration Guide - TripOptimizer

**Last Updated**: 2026-01-24
**Status**: Ready for Production API Integration

This guide provides step-by-step instructions for integrating real APIs into TripOptimizer.

---

## Overview

Currently, the following components use **stub implementations**:
- ✅ **Stripe Payment**: ✅ Fully integrated (mock mode available)
- ⚠️ **Amadeus Flight Booking**: Stub (needs real API)
- ⚠️ **Hotel Booking**: Stub (needs real API - Booking.com or alternative)
- ⚠️ **Activity Booking**: Stub (needs real API - Viator, GetYourGuide)

---

## 1. Stripe Payment API (Already Integrated)

**Status**: ✅ COMPLETE (with mock mode)

### Setup

1. **Create Stripe Account**: https://stripe.com
2. **Get API Keys**:
   - Dashboard → Developers → API keys
   - Copy "Secret key" (starts with `sk_test_` for test mode)
   - Copy "Webhook secret" (starts with `whsec_`)

3. **Add to `.env`**:
   ```bash
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   MOCK_STRIPE=false  # Set to true for mock mode
   ```

4. **Test Mode**:
   Use these test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`

### Production / Live Mode Setup

1. **Activate Account**:
   - Complete Stripe account activation (business verification)
   - Add bank account for payouts
   - Complete tax information

2. **Get Live API Keys**:
   - Dashboard → Developers → API keys
   - Toggle to "Live mode" (switch in top right)
   - Copy "Secret key" (starts with `sk_live_`)
   - Create webhook endpoint for live mode
   - Copy webhook secret (starts with `whsec_`)

3. **Update `.env` for Production**:
   ```bash
   # Stripe Configuration (PRODUCTION)
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET_HERE
   MOCK_STRIPE=false  # Must be false for live mode
   ```

4. **Important Production Considerations**:
   - ✅ Enable 3D Secure authentication for all payments
   - ✅ Set up webhook endpoints for payment confirmations
   - ✅ Implement proper error handling for declined cards
   - ✅ Monitor Stripe dashboard for chargebacks/disputes
   - ✅ Set up email receipts for customers
   - ✅ Comply with PCI-DSS requirements (Stripe handles most)
   - ⚠️ Test thoroughly with small transactions first

5. **Webhook Configuration**:
   ```
   Endpoint URL: https://your-domain.com/webhooks/stripe
   Events to listen for:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.refunded
   - charge.dispute.created
   ```

6. **Rate Limits (Live Mode)**:
   - 100 requests per second (default)
   - Can be increased upon request

### Usage

```typescript
import { createPaymentIntent, processRefund } from './integrations/stripe.integration';

// Create payment
const result = await createPaymentIntent({
  paymentMethodId: 'pm_1234567890',
  amount: 200000, // $2,000.00 in cents
  currency: 'USD',
  billingDetails: {
    name: 'John Doe',
    email: 'john@example.com',
  },
});

// Refund if booking fails
if (bookingFailed) {
  await processRefund(result.paymentIntentId, 'Booking failed');
}
```

---

## 2. Amadeus Flight API Integration

**Status**: ⚠️ STUB (needs implementation)

### Overview

Amadeus provides comprehensive flight search and booking APIs.

### Setup Steps

1. **Create Amadeus Account**:
   - Visit: https://developers.amadeus.com/register
   - Create a free "Self-Service" app

2. **Get API Credentials**:
   - Dashboard → My Apps → Create New App
   - Get API Key and API Secret
   - Note: Use "Test" environment for development

3. **Install SDK**:
   ```bash
   npm install amadeus --save
   ```

4. **Add to `.env`**:
   ```bash
   # Amadeus Flight API
   AMADEUS_API_KEY=YOUR_API_KEY_HERE
   AMADEUS_API_SECRET=YOUR_API_SECRET_HERE
   AMADEUS_ENVIRONMENT=test  # or 'production'
   ```

### Implementation

#### File to Create: `src/integrations/amadeus.integration.ts`

```typescript
/**
 * Amadeus Flight API Integration
 *
 * Provides real flight search and booking via Amadeus API.
 */

import Amadeus from 'amadeus';
import { FlightBookingConfirmation } from '../types/booking.types';

// Initialize Amadeus client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY!,
  clientSecret: process.env.AMADEUS_API_SECRET!,
  hostname: process.env.AMADEUS_ENVIRONMENT === 'production' ? 'production' : 'test',
});

/**
 * Search for flights
 */
export async function searchFlights(params: {
  originLocationCode: string; // e.g., "NYC"
  destinationLocationCode: string; // e.g., "BCN"
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  adults: number;
  maxPrice?: number;
  currencyCode?: string;
}): Promise<any[]> {
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults,
      max: params.maxPrice,
      currencyCode: params.currencyCode || 'USD',
    });

    return response.data;
  } catch (error) {
    console.error('Amadeus flight search error:', error);
    throw error;
  }
}

/**
 * Book a flight
 */
export async function bookFlight(params: {
  flightOfferId: string;
  travelers: Array<{
    id: string;
    dateOfBirth: string; // YYYY-MM-DD
    name: {
      firstName: string;
      lastName: string;
    };
    gender: 'MALE' | 'FEMALE';
    contact: {
      emailAddress: string;
      phones: Array<{
        deviceType: 'MOBILE';
        countryCallingCode: string;
        number: string;
      }>;
    };
    documents: Array<{
      documentType: 'PASSPORT';
      birthPlace: string;
      issuanceLocation: string;
      issuanceDate: string; // YYYY-MM-DD
      number: string;
      expiryDate: string; // YYYY-MM-DD
      issuanceCountry: string;
      validityCountry: string;
      nationality: string;
      holder: boolean;
    }>;
  }>;
}): Promise<FlightBookingConfirmation> {
  try {
    const response = await amadeus.booking.flightOrders.post({
      data: {
        type: 'flight-order',
        flightOffers: [params.flightOfferId],
        travelers: params.travelers,
      },
    });

    const order = response.data;

    // Convert Amadeus response to our FlightBookingConfirmation format
    return {
      confirmationCode: order.id,
      bookingReference: order.associatedRecords[0].reference,
      pnr: order.associatedRecords[0].originSystemCode,
      provider: order.flightOffers[0].validatingAirlineCodes[0],
      ticketNumbers: order.ticketNumbers || [],
      departureTime: order.flightOffers[0].itineraries[0].segments[0].departure.at,
      returnTime: order.flightOffers[0].itineraries[1]?.segments[0].departure.at || '',
      passengerNames: params.travelers.map(t => `${t.name.firstName} ${t.name.lastName}`),
      totalPrice: parseFloat(order.flightOffers[0].price.grandTotal) * 100, // Convert to cents
      currency: order.flightOffers[0].price.currency,
      deepLink: `https://www.amadeus.com/manage-booking/${order.id}`,
    };
  } catch (error) {
    console.error('Amadeus booking error:', error);
    throw error;
  }
}

/**
 * Cancel a flight booking
 */
export async function cancelFlight(orderId: string): Promise<boolean> {
  try {
    await amadeus.booking.flightOrder(orderId).delete();
    return true;
  } catch (error) {
    console.error('Amadeus cancellation error:', error);
    return false;
  }
}
```

#### Update `booking-orchestrator.service.ts`:

```typescript
// Replace the stub function with:
import { bookFlight as bookFlightAmadeus } from '../integrations/amadeus.integration';

async function bookFlight(flightOption: any): Promise<{
  success: boolean;
  confirmation?: FlightBookingConfirmation;
  error?: string;
}> {
  try {
    console.log('[BookingOrchestrator] Booking flight with Amadeus');

    const confirmation = await bookFlightAmadeus({
      flightOfferId: flightOption.offerId, // Stored when flight was searched
      travelers: [
        {
          id: '1',
          dateOfBirth: '1990-01-01', // TODO: Get from booking request
          name: {
            firstName: 'John', // TODO: Get from booking request
            lastName: 'Doe',
          },
          gender: 'MALE',
          contact: {
            emailAddress: 'john@example.com',
            phones: [{
              deviceType: 'MOBILE',
              countryCallingCode: '1',
              number: '1234567890',
            }],
          },
          documents: [
            // TODO: Get passport info from booking request
          ],
        },
      ],
    });

    return {
      success: true,
      confirmation,
    };
  } catch (error) {
    console.error('[BookingOrchestrator] Flight booking failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Flight booking failed',
    };
  }
}
```

### Testing

```bash
# Test flight search
curl -X GET "https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=NYC&destinationLocationCode=BCN&departureDate=2026-06-01&returnDate=2026-06-08&adults=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Rate Limits (Test Environment)

- **1 transaction per second**
- **10 transactions per month** (free tier)
- **Consider upgrading** for production

---

## 3. Hotel Booking API Integration

**Status**: ⚠️ STUB (needs implementation)

### Option A: Booking.com API (Recommended)

**Note**: Booking.com API access requires approval and is typically for partners.

#### Alternative: Rapid API (Booking.com)

1. **Sign up**: https://rapidapi.com/apidojo/api/booking
2. **Subscribe to plan** (Free tier: 500 requests/month)
3. **Get API Key**

4. **Add to `.env`**:
   ```bash
   # RapidAPI Booking.com
   RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY_HERE
   ```

5. **Install axios**:
   ```bash
   npm install axios --save
   ```

#### File to Create: `src/integrations/hotel.integration.ts`

```typescript
import axios from 'axios';
import { HotelBookingConfirmation } from '../types/booking.types';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = 'booking-com.p.rapidapi.com';

/**
 * Search for hotels
 */
export async function searchHotels(params: {
  destination: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  maxPrice?: number;
}): Promise<any[]> {
  try {
    const response = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/search', {
      params: {
        dest_type: 'city',
        dest_id: params.destination,
        checkin_date: params.checkIn,
        checkout_date: params.checkOut,
        adults_number: params.adults,
        room_number: 1,
        order_by: 'popularity',
        filter_by_currency: 'USD',
        price_filter_currencycode: 'USD',
      },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    return response.data.result;
  } catch (error) {
    console.error('Hotel search error:', error);
    throw error;
  }
}

/**
 * Book a hotel
 *
 * NOTE: Most APIs don't support direct booking without pre-approval.
 * Alternative: Generate deep link for user to complete booking on hotel site.
 */
export async function bookHotel(params: {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  guests: Array<{
    firstName: string;
    lastName: string;
    email: string;
  }>;
}): Promise<HotelBookingConfirmation> {
  // For now, generate a deep link and mock confirmation
  // Real booking requires API partner status

  const deepLink = `https://www.booking.com/hotel/${params.hotelId}?checkin=${params.checkIn}&checkout=${params.checkOut}`;

  return {
    confirmationCode: `HOTEL-${Date.now()}`,
    bookingReference: params.hotelId,
    hotelName: 'Hotel Name', // TODO: Get from hotel search
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights: calculateNights(params.checkIn, params.checkOut),
    guestNames: params.guests.map(g => `${g.firstName} ${g.lastName}`),
    totalPrice: 50000, // TODO: Get from hotel search
    currency: 'USD',
    deepLink,
  };
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
```

### Option B: Direct Hotel Chain APIs

Some hotel chains provide direct booking APIs:
- **Marriott**: Bonvoy API
- **Hilton**: Honors API
- **IHG**: IHG API

These require business partnerships and approval.

---

## 4. Activity Booking API Integration

**Status**: ⚠️ STUB (needs implementation)

### Option A: Viator API

1. **Apply for API Access**: https://www.viator.com/support/contact-us
2. **API Documentation**: https://docs.viator.com/

### Option B: GetYourGuide API

1. **Partner Program**: https://partner.getyourguide.com/
2. **API Access** requires partnership approval

### Option C: Google Things to Do API

1. **Google Things to Do**: Part of Google Travel APIs
2. **Requires**: Google Cloud Platform account

### Simple Implementation (Affiliate Links)

For MVP, you can use affiliate links instead of direct booking:

```typescript
export function generateActivityBookingLink(params: {
  activityName: string;
  destination: string;
  date: string;
}): string {
  // Generate Viator affiliate link
  const query = encodeURIComponent(`${params.activityName} ${params.destination}`);
  return `https://www.viator.com/search?text=${query}&pid=YOUR_AFFILIATE_ID`;
}
```

---

## 5. Testing Strategy

### Mock Mode (Current)

```bash
# Enable mock mode for all APIs
MOCK_STRIPE=true
MOCK_AMADEUS=true
MOCK_HOTELS=true
MOCK_ACTIVITIES=true

npm run dev
```

### Test Mode (Real APIs, Test Environment)

```bash
# Use real APIs in test mode
MOCK_STRIPE=false
STRIPE_SECRET_KEY=sk_test_...

AMADEUS_ENVIRONMENT=test
AMADEUS_API_KEY=...

npm run dev
```

### Production Mode

```bash
# Use production APIs
MOCK_STRIPE=false
STRIPE_SECRET_KEY=sk_live_...

AMADEUS_ENVIRONMENT=production
AMADEUS_API_KEY=...

npm run start
```

---

## 6. Environment Variables Summary

### Complete `.env` Template

```bash
# ============================================
# Database
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/tripoptimizer

# ============================================
# Stripe Payment (Phase 2)
# ============================================
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
MOCK_STRIPE=false  # true for mock mode

# ============================================
# Amadeus Flight API (Phase 2)
# ============================================
AMADEUS_API_KEY=YOUR_API_KEY_HERE
AMADEUS_API_SECRET=YOUR_API_SECRET_HERE
AMADEUS_ENVIRONMENT=test  # or 'production'

# ============================================
# Hotel Booking API (Phase 2)
# ============================================
RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY_HERE  # For Booking.com via RapidAPI
# OR
BOOKING_COM_API_KEY=YOUR_KEY_HERE    # If direct Booking.com access

# ============================================
# Activity Booking API (Phase 2)
# ============================================
VIATOR_API_KEY=YOUR_KEY_HERE         # If Viator API access
GETYOURGUIDE_API_KEY=YOUR_KEY_HERE   # If GetYourGuide access

# ============================================
# AI Services (Phase 1)
# ============================================
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
MOCK_CLAUDE=false  # true for mock mode

# ============================================
# Other Services
# ============================================
PORT=3000
NODE_ENV=development  # or 'production'
```

---

## 7. Cost Estimates

### Stripe
- **Transaction Fee**: 2.9% + $0.30 per successful charge
- **No monthly fee**
- **Refunds**: Original fee not refunded

### Amadeus (Test Environment)
- **Free Tier**: 10 transactions/month
- **Production**: Contact for pricing
- **Estimated**: $0.01 - $0.05 per search

### RapidAPI (Booking.com)
- **Free Tier**: 500 requests/month
- **Basic Plan**: $10/month (10,000 requests)
- **Pro Plan**: $50/month (100,000 requests)

### Viator/GetYourGuide
- **Commission-based**: 8-12% per booking
- **No API fees** (if approved partner)

---

## 8. Next Steps

### Immediate (Before Production)

1. **Set up Stripe**:
   - Create account
   - Add API keys to `.env`
   - Test payment flow

2. **Apply for Amadeus API**:
   - Create developer account
   - Get test credentials
   - Implement flight search + booking

3. **Choose Hotel Solution**:
   - Option A: RapidAPI + deep links (faster)
   - Option B: Apply for direct API access (better UX)

4. **Activities**:
   - Option A: Affiliate links (fastest)
   - Option B: Apply for API access (better UX)

### Testing Checklist

- [ ] Stripe payment succeeds
- [ ] Stripe refund works
- [ ] Flight search returns results
- [ ] Flight booking creates confirmation
- [ ] Hotel search returns results
- [ ] Activity links generate correctly
- [ ] Full booking flow succeeds
- [ ] Rollback works on failure

---

## 9. Support & Resources

### Stripe
- **Documentation**: https://stripe.com/docs
- **Support**: https://support.stripe.com

### Amadeus
- **Documentation**: https://developers.amadeus.com/docs
- **Support**: https://developers.amadeus.com/support

### RapidAPI
- **Documentation**: https://rapidapi.com/hub
- **Support**: https://rapidapi.com/contact

---

**Last Updated**: 2026-01-24
**Next Review**: After Phase 3 completion
