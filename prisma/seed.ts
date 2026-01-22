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
            post_logout_redirect_uris: ['http://localhost:5173/auth/signed-out', 'https://accounts.evzone.app/auth/signed-out'],
            grantTypes: ['authorization_code', 'refresh_token'],
            isPublic: true,
            isFirstParty: true,
            id_token_signed_response_alg: 'ES256'
        },
        update: {
            redirectUris: ['http://localhost:5173/auth/callback', 'https://accounts.evzone.app/auth/callback'],
            post_logout_redirect_uris: ['http://localhost:5173/auth/signed-out', 'https://accounts.evzone.app/auth/signed-out'],
            id_token_signed_response_alg: 'ES256'
        }
    });
    console.log('- Seeded OIDC Client: evzone-portal');

    // Seed System Apps
    const systemApps = [
        {
            clientId: 'wallet',
            name: 'EVZone Wallet',
            description: 'Manage funds, top-ups, and payments.',
            icon: 'CreditCard',
            website: 'https://wallet.evzone.app',
            color: '#03CD8C',
            isFirstParty: true,
            isPublic: true,
            redirectUris: ['https://wallet.evzone.app/callback']
        },
        {
            clientId: 'orgs',
            name: 'Organization Hub',
            description: 'Team management and enterprise billing.',
            icon: 'Users',
            website: 'https://orgs.evzone.app',
            color: '#3B82F6',
            isFirstParty: true,
            isPublic: true,
            redirectUris: ['https://orgs.evzone.app/callback']
        },
        {
            clientId: 'dev',
            name: 'Developer Portal',
            description: 'API keys, OAuth clients, and docs.',
            icon: 'Code',
            website: 'https://developers.evzone.app',
            color: '#8B5CF6',
            isFirstParty: true,
            isPublic: true,
            redirectUris: ['https://developers.evzone.app/callback']
        },
        {
            clientId: 'marketplace',
            name: 'Marketplace',
            description: 'Buy and sell across the Evzone ecosystem.',
            icon: 'ShoppingCart',
            website: 'https://marketplace.evzone.app',
            color: '#10B981',
            isFirstParty: true,
            isPublic: true,
            redirectUris: ['https://marketplace.evzone.app/callback']
        },
        {
            clientId: 'rider',
            name: 'Rider App',
            description: 'Reliable deliveries and rides.',
            icon: 'Bike',
            website: 'https://rider.evzone.app',
            color: '#F59E0B',
            isFirstParty: true,
            isPublic: true,
            redirectUris: ['https://rider.evzone.app/callback']
        },
        {
            clientId: 'mylivedeals',
            name: 'MyLiveDeals',
            description: 'Real-time discounts and offers.',
            icon: 'Percent',
            website: 'https://mylivedeals.evzone.app',
            color: '#EF4444',
            isFirstParty: true,
            isPublic: true,
            redirectUris: ['https://mylivedeals.evzone.app/callback']
        },
        {
            clientId: 'charging',
            name: 'EVzone Charging',
            description: 'Locate and pay for EV charging.',
            icon: 'Zap',
            website: 'https://charging.evzone.app',
            color: '#03CD8C',
            isFirstParty: true,
            isPublic: true,
            redirectUris: ['https://charging.evzone.app/callback']
        }
    ];

    for (const app of systemApps) {
        await prisma.oAuthClient.upsert({
            where: { clientId: app.clientId },
            create: app,
            update: {
                name: app.name,
                description: app.description,
                icon: app.icon,
                website: app.website,
                color: app.color,
                isFirstParty: app.isFirstParty,
                isPublic: app.isPublic
            }
        });
        console.log(`- Seeded System App: ${app.name}`);
    }

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
