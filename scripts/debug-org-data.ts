
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debug Org Data ---');

    const userCount = await prisma.user.count();
    console.log(`Total Users: ${userCount}`);

    const orgCount = await prisma.organization.count();
    console.log(`Total Orgs: ${orgCount}`);

    const orgs = await prisma.organization.findMany({
        include: {
            members: {
                include: {
                    user: {
                        select: { email: true, firstName: true }
                    }
                }
            }
        }
    });

    console.log(JSON.stringify(orgs, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
