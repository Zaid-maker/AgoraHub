import { seedData } from './lib/actions';

async function main() {
    console.log('Seeding initial forum data...');
    await seedData();
    console.log('Seed completed successfully.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
