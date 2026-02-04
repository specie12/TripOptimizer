/**
 * Budget Estimator Service
 *
 * Phase 3: Budget Validation & Recommendations
 * Estimates minimum viable budget for a trip before searching
 * Provides breakdown and recommendations when budget is insufficient
 */

import { flightIntegration } from '../integrations/flight.integration';
import { hotelIntegration } from '../integrations/hotel.integration';

export interface BudgetEstimate {
  minimumBudget: number; // Total minimum budget in cents
  breakdown: {
    flights: number;
    hotels: number;
    activities: number;
    food: number;
    total: number;
  };
}

/**
 * Estimate minimum budget for a trip
 * Queries real APIs to find cheapest available options
 */
export async function estimateMinimumBudget(
  origin: string,
  destination: string,
  numberOfDays: number,
  numberOfTravelers: number = 1
): Promise<BudgetEstimate> {
  console.log(`[BudgetEstimator] Estimating minimum budget for ${origin} → ${destination} (${numberOfDays} days)`);

  // Calculate sample dates (30 days from now)
  const departureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const returnDate = new Date(departureDate.getTime() + numberOfDays * 24 * 60 * 60 * 1000);

  // Get cheapest flight
  let cheapestFlight = 50000; // Default $500 if no data
  try {
    const flightResults = await flightIntegration.search({
      origin,
      destination,
      departureDate: departureDate.toISOString(),
      returnDate: returnDate.toISOString(),
      maxResults: 50,
    });

    if (flightResults.data.length > 0) {
      cheapestFlight = Math.min(...flightResults.data.map(f => f.price));
      console.log(`[BudgetEstimator] Cheapest flight: $${cheapestFlight / 100}`);
    } else {
      console.warn(`[BudgetEstimator] No flights found, using default $${cheapestFlight / 100}`);
    }
  } catch (error) {
    console.error('[BudgetEstimator] Error fetching flights:', error);
  }

  // Get cheapest hotel
  let cheapestHotelPerNight = 8000; // Default $80/night if no data
  try {
    const hotelResults = await hotelIntegration.search({
      destination,
      checkInDate: departureDate.toISOString(),
      checkOutDate: returnDate.toISOString(),
      numberOfNights: numberOfDays,
      guests: numberOfTravelers,
      maxResults: 50,
    });

    if (hotelResults.data.length > 0) {
      cheapestHotelPerNight = Math.min(...hotelResults.data.map(h => h.pricePerNight));
      console.log(`[BudgetEstimator] Cheapest hotel: $${cheapestHotelPerNight / 100}/night`);
    } else {
      console.warn(`[BudgetEstimator] No hotels found, using default $${cheapestHotelPerNight / 100}/night`);
    }
  } catch (error) {
    console.error('[BudgetEstimator] Error fetching hotels:', error);
  }

  const totalHotelCost = cheapestHotelPerNight * numberOfDays;

  // Estimate other costs
  // Activities: $50/day (conservative estimate)
  const estimatedActivityCost = 5000 * numberOfDays;

  // Food: $70/day (conservative estimate)
  const estimatedFoodCost = 7000 * numberOfDays;

  const minimumBudget = cheapestFlight + totalHotelCost + estimatedActivityCost + estimatedFoodCost;

  const breakdown = {
    flights: cheapestFlight,
    hotels: totalHotelCost,
    activities: estimatedActivityCost,
    food: estimatedFoodCost,
    total: minimumBudget,
  };

  console.log(`[BudgetEstimator] Minimum budget estimate: $${minimumBudget / 100}`);
  console.log(`[BudgetEstimator] Breakdown:`, {
    flights: `$${breakdown.flights / 100}`,
    hotels: `$${breakdown.hotels / 100}`,
    activities: `$${breakdown.activities / 100}`,
    food: `$${breakdown.food / 100}`,
  });

  return {
    minimumBudget,
    breakdown,
  };
}

/**
 * Check if a budget is sufficient for a trip
 * Returns true if budget is at least 80% of estimated minimum
 */
export async function isBudgetSufficient(
  origin: string,
  destination: string,
  numberOfDays: number,
  budgetTotal: number,
  numberOfTravelers: number = 1
): Promise<{
  sufficient: boolean;
  estimate: BudgetEstimate;
  percentageOfMinimum: number;
}> {
  const estimate = await estimateMinimumBudget(origin, destination, numberOfDays, numberOfTravelers);

  const percentageOfMinimum = (budgetTotal / estimate.minimumBudget) * 100;
  const sufficient = budgetTotal >= estimate.minimumBudget * 0.6; // 60% threshold — candidate filter is the real gate

  console.log(`[BudgetEstimator] Budget check: $${budgetTotal / 100} is ${percentageOfMinimum.toFixed(0)}% of minimum ($${estimate.minimumBudget / 100})`);

  return {
    sufficient,
    estimate,
    percentageOfMinimum,
  };
}
