
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- OIDC Payload Audit ---');
    const payloads = await prisma.oidcPayload.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${payloads.length} recent payloads.`);
    payloads.forEach(p => {
        console.log(`ID: ${p.id}, Type: ${p.type}, UID: ${p.uid}, ExpiresAt: ${p.expiresAt}`);
    });

    const interactionCount = await prisma.oidcPayload.count({ where: { type: 'Interaction' } });
    const sessionCount = await prisma.oidcPayload.count({ where: { type: 'Session' } });
    console.log(`Total Interactions: ${interactionCount}, Total Sessions: ${sessionCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
