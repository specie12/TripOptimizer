"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const budgetConfigs = [
    {
        travelStyle: client_1.TravelStyle.BUDGET,
        flightPct: 0.35, // 35% for flights
        hotelPct: 0.40, // 40% for hotels
        bufferPct: 0.10, // 10% emergency buffer
        // Remaining 15% for activities/discretionary
    },
    {
        travelStyle: client_1.TravelStyle.BALANCED,
        flightPct: 0.40, // 40% for flights
        hotelPct: 0.45, // 45% for hotels
        bufferPct: 0.10, // 10% emergency buffer
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
        console.log(`✓ ${config.travelStyle}: ` +
            `${config.flightPct * 100}% flight, ` +
            `${config.hotelPct * 100}% hotel, ` +
            `${config.bufferPct * 100}% buffer ` +
            `(${remaining}% remaining for activities)`);
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
//# sourceMappingURL=seed.js.map