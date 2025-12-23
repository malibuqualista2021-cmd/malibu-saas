/**
 * Database Seed Script
 * Creates admin user and test data for development
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await hash(process.env.ADMIN_PASSWORD || 'Admin123!', 12);

    const admin = await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL || 'admin@malibu.com' },
        update: {},
        create: {
            email: process.env.ADMIN_EMAIL || 'admin@malibu.com',
            password: adminPassword,
            name: 'Admin',
            tradingViewUsername: 'malibu_admin',
            role: 'ADMIN',
            isActive: true,
            subscription: {
                create: {
                    status: 'ACTIVE',
                    startDate: new Date(),
                    endDate: null, // Lifetime
                    trialUsed: true,
                }
            }
        }
    });

    console.log('✅ Admin user created:', admin.email);

    // Create a test user pending approval
    const testPassword = await hash('Test123!', 12);

    const testUser = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            password: testPassword,
            name: 'Test User',
            tradingViewUsername: 'testuser123',
            role: 'USER',
            subscription: {
                create: {
                    status: 'PENDING_APPROVAL',
                    trialUsed: false,
                }
            }
        }
    });

    console.log('✅ Test user created:', testUser.email);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log(`   Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
    console.log(`   Test:  ${testUser.email} / Test123!`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
