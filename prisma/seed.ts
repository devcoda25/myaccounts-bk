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

    // [New] Seed Default Clients
    // Portal (Public - React App)
    await prisma.oAuthClient.upsert({
        where: { clientId: 'evzone-portal' },
        create: {
            clientId: 'evzone-portal',
            name: 'EVZone Portal',
            redirectUris: ['http://localhost:5173/auth/callback', 'https://accounts.evzone.app/auth/callback'],
            grantTypes: ['authorization_code', 'refresh_token'],
            isPublic: true,
            isFirstParty: true
        },
        update: {
            redirectUris: ['http://localhost:5173/auth/callback', 'https://accounts.evzone.app/auth/callback']
        }
    });
    console.log('- Seeded OIDC Client: evzone-portal');

    // Charging (Backend - Confidential)
    const chargingSecret = process.env.CHARGING_CLIENT_SECRET || 'secret_charging_dev';
    const chargingHash = await argon2.hash(chargingSecret);
    await prisma.oAuthClient.upsert({
        where: { clientId: 'evzone-charging' },
        create: {
            clientId: 'evzone-charging',
            name: 'EVZone Charging',
            redirectUris: ['https://charging.evzone.app/auth/callback'],
            grantTypes: ['authorization_code'],
            clientSecretHash: chargingHash,
            isPublic: false,
            isFirstParty: true
        },
        update: {
            // Keep existing secret if matched
        }
    });
    console.log('- Seeded OIDC Client: evzone-charging');

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

    console.log(`- Seeded Test User: ${testUser.email}`);

    // Org seeding removed

    // Seed Audit Logs (User Only)
    // 1. INFO: 20 min ago. Update Profile. Actor: Ronald.
    await prisma.auditLog.create({
        data: {
            userId: testUser.id,
            action: 'Updated Profile',
            severity: 'info',
            actorName: 'Ronald',
            details: { field: 'avatar' },
            createdAt: new Date(Date.now() - 20 * 60 * 1000) // 20 mins ago
        }
    });

    console.log(`- Seeded User Audit Logs`);

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
