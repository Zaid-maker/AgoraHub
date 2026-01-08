import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const email = process.argv[2];

if (!email) {
    console.error("Please provide an email address as an argument.");
    console.error("Usage: bun prisma/promote.ts <email>");
    process.exit(1);
}

async function main() {
    console.log(`Promoting user with email: ${email}...`);
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: "admin" }
        });
        console.log(`✅ Success! User ${user.name} (${user.email}) is now an Admin.`);
    } catch (error) {
        console.error("❌ Error: User not found or database error.");
        console.error(error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
