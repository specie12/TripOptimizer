import { PrismaClient, TravelStyle } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for TripOptimizer database
 *
 * Seeds the BudgetConfig table with default budget allocation percentages.
 *
 * Budget Allocation Notes:
 * - Percentages are stored as decimals (e.g., 0.35 = 35%)
 * - BUDGET style: 35% flight + 40% hotel + 10% buffer = 85% allocated
 *   → Remaining 15% is for activities and discretionary spending
 * - BALANCED style: 40% flight + 45% hotel + 10% buffer = 95% allocated
 *   → Remaining 5% is for activities and discretionary spending
 *
 * These percentages are used for deterministic budget calculations
 * and are not generated or modified by AI.
 */

interface BudgetConfigSeed {
  travelStyle: TravelStyle;
  flightPct: number;
  hotelPct: number;
  bufferPct: number;
}

const budgetConfigs: BudgetConfigSeed[] = [
  {
    travelStyle: TravelStyle.BUDGET,
    flightPct: 0.35,  // 35% for flights
    hotelPct: 0.40,   // 40% for hotels
    bufferPct: 0.10,  // 10% emergency buffer
    // Remaining 15% for activities/discretionary
  },
  {
    travelStyle: TravelStyle.BALANCED,
    flightPct: 0.40,  // 40% for flights
    hotelPct: 0.45,   // 45% for hotels
    bufferPct: 0.10,  // 10% emergency buffer
    // Remaining 5% for activities/discretionary
  },
];

async function main() {
  console.log('Seeding database...');

  for (const config of budgetConfigs) {
    const result = await prisma.budgetConfig.upsert({
      where: { travelStyle: config.travelStyle },
      update: {
        flightPct: config.flightPct,
        hotelPct: config.hotelPct,
        bufferPct: config.bufferPct,
      },
      create: {
        travelStyle: config.travelStyle,
        flightPct: config.flightPct,
        hotelPct: config.hotelPct,
        bufferPct: config.bufferPct,
      },
    });

    const totalAllocated = (config.flightPct + config.hotelPct + config.bufferPct) * 100;
    const remaining = 100 - totalAllocated;

    console.log(
      `✓ ${config.travelStyle}: ` +
      `${config.flightPct * 100}% flight, ` +
      `${config.hotelPct * 100}% hotel, ` +
      `${config.bufferPct * 100}% buffer ` +
      `(${remaining}% remaining for activities)`
    );
  }

  console.log('\nSeeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
