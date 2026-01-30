/**
 * Request Logger Middleware
 *
 * Phase 4: Real-time Monitoring & Debugging
 * Logs detailed information about trip generation requests for debugging
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to log trip generation requests with detailed timing and results
 * Helps debug failures and understand why certain routes don't work
 */
export function logTripGeneration(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/trip/generate' || req.path.includes('/trip/generate')) {
    const startTime = Date.now();
    const body = req.body;

    // Log request details
    console.log('\n' + '='.repeat(60));
    console.log('🚀 TRIP GENERATION REQUEST');
    console.log('='.repeat(60));
    console.log(`📍 Origin:       ${body.originCity || 'N/A'}`);
    console.log(`🎯 Destination:  ${body.destination || 'N/A'}`);
    console.log(`💰 Budget:       $${body.budgetTotal ? (body.budgetTotal / 100).toFixed(2) : 'N/A'}`);
    console.log(`📅 Days:         ${body.numberOfDays || 'N/A'}`);
    console.log(`👥 Travelers:    ${body.numberOfTravelers || 1}`);
    console.log(`✨ Style:        ${body.travelStyle || 'BALANCED'}`);
    console.log(`⏰ Timestamp:    ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    // Intercept the response to log results
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      const duration = Date.now() - startTime;

      console.log('\n' + '='.repeat(60));
      console.log('📊 TRIP GENERATION RESPONSE');
      console.log('='.repeat(60));
      console.log(`⏱️  Duration:     ${duration}ms`);
      console.log(`📡 Status:       ${res.statusCode}`);

      if (res.statusCode === 400) {
        // Error response
        if (data.error === 'no_options') {
          console.log('❌ RESULT:       NO OPTIONS GENERATED');
          console.log(`🔍 Reason:       ${data.data?.reason || 'unknown'}`);
          console.log(`💡 Suggestion:   ${data.data?.suggestion || 'N/A'}`);
        } else if (data.error === 'insufficient_budget') {
          console.log('❌ RESULT:       INSUFFICIENT BUDGET');
          console.log(`💵 Minimum:      ${data.data?.breakdown?.total || 'N/A'}`);
          console.log(`💡 Suggestion:   ${data.data?.suggestion || 'N/A'}`);
        } else {
          console.log('❌ RESULT:       ERROR');
          console.log(`⚠️  Error:        ${data.error}`);
          console.log(`📝 Message:      ${data.message}`);
        }
      } else if (res.statusCode === 200) {
        // Success response
        const optionCount = data.options?.length || 0;
        console.log(`✅ RESULT:       SUCCESS`);
        console.log(`📦 Options:      ${optionCount} trip options generated`);

        if (optionCount > 0) {
          console.log('\n📋 GENERATED OPTIONS:');
          data.options.slice(0, 3).forEach((option: any, index: number) => {
            console.log(`   ${index + 1}. ${option.destination}`);
            console.log(`      💰 Cost: $${(option.totalCost / 100).toFixed(2)}`);
            console.log(`      ✈️  Flight: ${option.flight?.provider || 'N/A'} - $${option.flight?.price ? (option.flight.price / 100).toFixed(2) : 'N/A'}`);
            console.log(`      🏨 Hotel: ${option.hotel?.name || 'N/A'} - $${option.hotel?.priceTotal ? (option.hotel.priceTotal / 100).toFixed(2) : 'N/A'}`);
          });
        }
      } else {
        console.log(`⚠️  RESULT:       HTTP ${res.statusCode}`);
      }

      console.log('='.repeat(60));
      console.log('END REQUEST\n');

      return originalJson(data);
    };
  }

  next();
}

/**
 * Middleware to log all API requests (lightweight version)
 */
export function logApiRequest(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusEmoji = res.statusCode < 400 ? '✅' : '❌';
    console.log(
      `${statusEmoji} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}
