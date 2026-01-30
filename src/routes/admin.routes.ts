/**
 * Admin Routes
 *
 * Phase 4: Real-time Monitoring & Debugging
 * Administrative endpoints for monitoring destination support and system health
 */

import express, { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getAllCachedAirportCodes } from '../services/airport-cache.service';
import { flightIntegration } from '../integrations/flight.integration';
import { hotelIntegration } from '../integrations/hotel.integration';

const router: Router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /admin/destinations/support
 * Returns detailed information about which destinations are supported
 */
router.get('/destinations/support', async (req: Request, res: Response) => {
  try {
    console.log('[Admin] Generating destination support report...');

    // Get all cached airport codes
    const airportCodes = await getAllCachedAirportCodes();

    // Get trip generation stats by destination (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const tripStats = await prisma.tripRequest.groupBy({
      by: ['destination'],
      _count: { id: true },
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        destination: {
          not: null,
        },
      },
    });

    // Test each cached destination for flight and hotel availability
    const destinationSupport = await Promise.all(
      airportCodes.map(async (airport) => {
        const hasFlights = await testFlightAvailability(airport.cityName);
        const hasHotels = await testHotelAvailability(airport.cityName);
        const tripCount = tripStats.find(
          (s) => s.destination === airport.cityName
        )?._count.id || 0;

        return {
          city: airport.cityName,
          airportCode: airport.iataCode,
          resolvedBy: airport.resolvedBy,
          flightSupport: hasFlights ? 'yes' : 'no',
          hotelSupport: hasHotels ? 'yes' : 'no',
          fullySupported: hasFlights && hasHotels,
          recentTrips: tripCount,
          lastUpdated: airport.updatedAt,
        };
      })
    );

    const fullySupported = destinationSupport.filter((d) => d.fullySupported);
    const partialSupport = destinationSupport.filter((d) => !d.fullySupported);

    res.json({
      totalDestinations: airportCodes.length,
      fullySupported: fullySupported.length,
      partialSupport: partialSupport.length,
      destinations: destinationSupport.sort((a, b) => b.recentTrips - a.recentTrips),
      summary: {
        mostPopular: destinationSupport
          .sort((a, b) => b.recentTrips - a.recentTrips)
          .slice(0, 10)
          .map((d) => ({ city: d.city, trips: d.recentTrips })),
        unsupported: partialSupport.map((d) => ({
          city: d.city,
          missingFlights: d.flightSupport === 'no',
          missingHotels: d.hotelSupport === 'no',
        })),
      },
    });
  } catch (error) {
    console.error('[Admin] Error generating destination support report:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to generate destination support report',
    });
  }
});

/**
 * GET /admin/stats
 * Returns general system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    console.log('[Admin] Generating system statistics...');

    // Total trips
    const totalTrips = await prisma.tripRequest.count();

    // Trips in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTrips = await prisma.tripRequest.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    // Average budget
    const budgetStats = await prisma.tripRequest.aggregate({
      _avg: { budgetTotal: true },
      _min: { budgetTotal: true },
      _max: { budgetTotal: true },
    });

    // Most popular destinations
    const popularDestinations = await prisma.tripRequest.groupBy({
      by: ['destination'],
      _count: { id: true },
      where: {
        destination: {
          not: null,
        },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Cached airport codes
    const airportCodeCount = await prisma.airportCode.count();

    res.json({
      trips: {
        total: totalTrips,
        last24Hours: recentTrips,
      },
      budget: {
        average: budgetStats._avg.budgetTotal,
        min: budgetStats._min.budgetTotal,
        max: budgetStats._max.budgetTotal,
      },
      popularDestinations: popularDestinations.map((d) => ({
        destination: d.destination,
        count: d._count.id,
      })),
      cache: {
        airportCodes: airportCodeCount,
      },
    });
  } catch (error) {
    console.error('[Admin] Error generating system statistics:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to generate system statistics',
    });
  }
});

/**
 * Test if flights are available for a destination
 */
async function testFlightAvailability(cityName: string): Promise<boolean> {
  try {
    const testDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const returnDate = new Date(testDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Use a well-known origin city for testing
    const response = await flightIntegration.search({
      origin: 'New York',
      destination: cityName,
      departureDate: testDate.toISOString(),
      returnDate: returnDate.toISOString(),
      maxResults: 1,
    });

    return response.data.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Test if hotels are available for a destination
 */
async function testHotelAvailability(cityName: string): Promise<boolean> {
  try {
    const testDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const returnDate = new Date(testDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const response = await hotelIntegration.search({
      destination: cityName,
      checkInDate: testDate.toISOString(),
      checkOutDate: returnDate.toISOString(),
      numberOfNights: 7,
      guests: 1,
      maxResults: 1,
    });

    return response.data.length > 0;
  } catch (error) {
    return false;
  }
}

export default router;
