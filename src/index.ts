// TripOptimizer - Entry Point
// This file is a placeholder for future application code

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('TripOptimizer - Database connection test');

  // Test database connection
  const budgetConfigs = await prisma.budgetConfig.findMany();
  console.log('Budget configs loaded:', budgetConfigs.length);

  for (const config of budgetConfigs) {
    console.log(`- ${config.travelStyle}: ${config.flightPct * 100}% flight, ${config.hotelPct * 100}% hotel`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
