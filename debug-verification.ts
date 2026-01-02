import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking verification_requests table...');

    // Check for the specific code seen in logs
    const specificCode = await prisma.verificationRequest.findFirst({
        where: { token: '545785' }
    });

    if (specificCode) {
        console.log('Found specific code 545785:', specificCode);
    } else {
        console.log('Code 545785 NOT found.');
    }

    // List all recent requests to see what's actually there
    const recent = await prisma.verificationRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    console.log('Recent Verification Requests:', recent);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
