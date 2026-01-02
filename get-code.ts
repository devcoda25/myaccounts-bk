import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const requests = await prisma.verificationRequest.findMany({
        where: { identifier: 'devcoda25@gmail.com', type: 'EMAIL_VERIFY' },
        orderBy: { createdAt: 'desc' },
        take: 1
    });

    if (requests.length > 0) {
        console.log(`Latest Code: ${requests[0].token}`);
    } else {
        console.log('No verification code found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
