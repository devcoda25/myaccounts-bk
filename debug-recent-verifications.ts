import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Verification Requests Table ---');

    // 1. Count total records
    const count = await prisma.verificationRequest.count();
    console.log(`Total Records: ${count}`);

    // 2. Fetch last 5 requests
    const recent = await prisma.verificationRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
    });

    console.log('--- Last 5 Requests ---');
    if (recent.length === 0) {
        console.log('No verification requests found.');
    } else {
        recent.forEach(r => {
            console.log(`[${r.createdAt.toISOString()}] Type: ${r.type}, To: ${r.identifier}, Token: ${r.token}`);
        });
    }

    console.log('---------------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
