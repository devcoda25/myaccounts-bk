import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking User table...');

    // Check for the user
    const user = await prisma.user.findUnique({
        where: { email: 'devcoda25@gmail.com' }
    });

    if (user) {
        console.log('User FOUND:', user.id, user.email);
    } else {
        console.log('User NOT found.');
    }

    // Double check verifications again with broad query
    const count = await prisma.verificationRequest.count();
    console.log('Total Verification Requests in DB:', count);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
