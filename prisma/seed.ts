import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Database Seed ---');

    // 1. Create Test OIDC Client
    const client = await prisma.oAuthClient.upsert({
        where: { clientId: 'test-app' },
        create: {
            clientId: 'test-app',
            name: 'Developer Test App',
            redirectUris: ['http://localhost:3001/callback'],
            isFirstParty: true
        },
        update: {}
    });
    console.log(`- Seeded OIDC Client: ${client.clientId}`);

    // 2. Create Super Admin User
    const adminPasswordHash = await argon2.hash('superadmin-secure-pw');
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@evzone.com' },
        create: {
            email: 'admin@evzone.com',
            firstName: 'Super',
            otherNames: 'Admin',
            emailVerified: true,
            passwordHash: adminPasswordHash,
            role: 'SUPER_ADMIN'
        },
        update: {
            role: 'SUPER_ADMIN',
            passwordHash: adminPasswordHash // Ensure password is correct
        }
    });
    console.log(`- Seeded Super Admin: ${adminUser.email}`);

    // 3. Create Staff Admin User (Role: ADMIN)
    const staffPasswordHash = await argon2.hash('staff-secure-pw');
    const staffUser = await prisma.user.upsert({
        where: { email: 'staff@evzone.com' },
        create: {
            email: 'staff@evzone.com',
            firstName: 'Staff',
            otherNames: 'Member',
            emailVerified: true,
            passwordHash: staffPasswordHash,
            role: 'ADMIN'
        },
        update: {
            role: 'ADMIN',
            passwordHash: staffPasswordHash
        }
    });
    console.log(`- Seeded Staff Admin: ${staffUser.email}`);

    // 3. Create Standard Test User
    const testPasswordHash = await argon2.hash('password123');
    const testUser = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        create: {
            email: 'test@example.com',
            firstName: 'Test',
            otherNames: 'User',
            emailVerified: true,
            passwordHash: testPasswordHash,
            role: 'USER'
        },
        update: {
            role: 'USER'
        }
    });
    console.log(`- Seeded Test User: ${testUser.email}`);

    // 4. Create Org with SSO and Audit Logs for Test User
    const org = await prisma.organization.upsert({
        where: { domain: 'evzone-enterprise.com' },
        create: {
            name: 'EVzone Enterprise',
            type: 'enterprise',
            domain: 'evzone-enterprise.com',
            ssoEnabled: true,
            ssoDomains: ['evzone.com', 'partners.evzone.com'],
            members: {
                create: {
                    userId: testUser.id,
                    role: 'Owner'
                }
            }
        },
        update: {
            ssoEnabled: true,
            ssoDomains: ['evzone.com', 'partners.evzone.com']
        }
    });

    // Determine Org ID (needed for audits)
    const orgId = org.id;

    // Seed Audit Logs
    // 1. INFO: 20 min ago. Invited 2 members. Actor: Ronald.
    await prisma.auditLog.create({
        data: {
            orgId: orgId,
            action: 'Invited 2 members',
            severity: 'info',
            actorName: 'Ronald',
            details: { invitedEmails: ['alice@evzone.com', 'bob@evzone.com'] },
            createdAt: new Date(Date.now() - 20 * 60 * 1000) // 20 mins ago
        }
    });

    // 2. WARNING: 4 hr ago. Enabled SSO. Actor: Admin.
    await prisma.auditLog.create({
        data: {
            orgId: orgId,
            action: 'Enabled SSO',
            severity: 'warning',
            actorName: 'Admin',
            details: { enabled: true },
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        }
    });

    // 3. CRITICAL: 1 day ago. Blocked suspicious login. Actor: System.
    await prisma.auditLog.create({
        data: {
            orgId: orgId,
            action: 'Blocked suspicious login',
            severity: 'critical',
            actorName: 'System',
            details: { reason: 'IP Reputation', ip: '192.168.1.100' },
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        }
    });

    console.log(`- Seeded Org and Audit Logs: ${org.name}`);

    // 5. Create 10 Extra Dummy Users
    for (let i = 1; i <= 10; i++) {
        const dummyEmail = `user${i}@demo.com`;
        const dummyName = `User ${i}`;
        const dummyPassword = await argon2.hash('password123');
        await prisma.user.upsert({
            where: { email: dummyEmail },
            create: {
                email: dummyEmail,
                firstName: 'Demo',
                otherNames: dummyName,
                emailVerified: true,
                passwordHash: dummyPassword,
                role: 'USER'
            },
            update: {}
        });
    }
    console.log(`- Seeded 10 extra dummy users (user1@demo.com to user10@demo.com)`);

    console.log('--- Seeding Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
