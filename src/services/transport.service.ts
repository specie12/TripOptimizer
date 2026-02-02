/**
 * Transport Service
 *
 * Provides city-aware transport cost ranges using a static lookup table.
 * Falls back to default estimates for unknown cities.
 */

import transportCosts from '../data/transport-costs.json';

interface CostRange {
  low: number;
  high: number;
}

interface TransportLink {
  label: string;
  url: string;
}

export interface CityTransportData {
  dailyCostRange: CostRange;
  airportTransferRange: CostRange;
  transitPassName: string;
  links: {
    publicTransit: TransportLink;
    rideHailing: TransportLink;
    taxi: TransportLink;
    airportTransfer: TransportLink;
  };
  tips: string[];
}

export interface TransportCostRange {
  costRangeLow: number;
  costRangeHigh: number;
  isEstimate: boolean;
  cityData: CityTransportData;
}

const cityData = transportCosts as Record<string, CityTransportData>;

/**
 * Normalize a city name for lookup.
 * Strips common suffixes, lowercases, and trims.
 */
function normalizeCity(destination: string): string {
  return destination
    .toLowerCase()
    .replace(/,.*$/, '')  // Remove country/state after comma
    .replace(/\s*(city|metro|area|region|international)\s*/gi, ' ')
    .trim();
}

/**
 * Get transport cost range for a destination and trip duration.
 *
 * Formula: (dailyCost * days) + (airportTransfer * 2 round-trip)
 * All values in cents.
 */
export function getTransportCostRange(
  destination: string,
  numberOfDays: number
): TransportCostRange {
  const normalized = normalizeCity(destination);
  const entry = cityData[normalized] || null;
  const isEstimate = !entry;
  const data: CityTransportData = entry || cityData['_default'];

  const costRangeLow =
    data.dailyCostRange.low * numberOfDays +
    data.airportTransferRange.low * 2;

  const costRangeHigh =
    data.dailyCostRange.high * numberOfDays +
    data.airportTransferRange.high * 2;

  return { costRangeLow, costRangeHigh, isEstimate, cityData: data };
}

/**
 * Get full city transport data for the transport info page.
 * Returns the city data plus computed range for the given days.
 */
export function getCityTransportInfo(
  destination: string,
  numberOfDays: number
): {
  cityName: string;
  range: TransportCostRange;
} {
  const normalized = normalizeCity(destination);
  const range = getTransportCostRange(destination, numberOfDays);

  // Find the best display name (capitalize first letters)
  const displayName = normalized
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return { cityName: displayName, range };
}
