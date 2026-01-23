import { PrismaClient, TravelStyle } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for TripOptimizer database
 *
 * Seeds the BudgetConfig table with default budget allocation percentages.
 *
 * Budget Allocation Notes (Phase 1 - 6 categories):
 * - Percentages are stored as decimals (e.g., 0.35 = 35%)
 * - BUDGET style: Focus on cost savings
 * - BALANCED style: Balance of comfort and value
 *
 * These percentages are used for deterministic budget calculations
 * and are not generated or modified by AI.
 */

interface BudgetConfigSeed {
  travelStyle: TravelStyle;
  flightPct: number;
  hotelPct: number;
  activityPct: number;
  foodPct: number;
  transportPct: number;
  contingencyPct: number;
}

const budgetConfigs: BudgetConfigSeed[] = [
  {
    travelStyle: TravelStyle.BUDGET,
    flightPct: 0.35,      // 35% for flights
    hotelPct: 0.35,       // 35% for hotels
    activityPct: 0.10,    // 10% for activities
    foodPct: 0.08,        // 8% for food
    transportPct: 0.07,   // 7% for transport
    contingencyPct: 0.05, // 5% emergency buffer
  },
  {
    travelStyle: TravelStyle.BALANCED,
    flightPct: 0.35,      // 35% for flights
    hotelPct: 0.40,       // 40% for hotels
    activityPct: 0.12,    // 12% for activities
    foodPct: 0.08,        // 8% for food
    transportPct: 0.03,   // 3% for transport
    contingencyPct: 0.02, // 2% emergency buffer
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
        activityPct: config.activityPct,
        foodPct: config.foodPct,
        transportPct: config.transportPct,
        contingencyPct: config.contingencyPct,
      },
      create: {
        travelStyle: config.travelStyle,
        flightPct: config.flightPct,
        hotelPct: config.hotelPct,
        activityPct: config.activityPct,
        foodPct: config.foodPct,
        transportPct: config.transportPct,
        contingencyPct: config.contingencyPct,
      },
    });

    const totalAllocated = (
      config.flightPct +
      config.hotelPct +
      config.activityPct +
      config.foodPct +
      config.transportPct +
      config.contingencyPct
    ) * 100;

    console.log(
      `✓ ${config.travelStyle}: ` +
      `${config.flightPct * 100}% flight, ` +
      `${config.hotelPct * 100}% hotel, ` +
      `${config.activityPct * 100}% activity, ` +
      `${config.foodPct * 100}% food, ` +
      `${config.transportPct * 100}% transport, ` +
      `${config.contingencyPct * 100}% contingency ` +
      `(total: ${totalAllocated}%)`
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
