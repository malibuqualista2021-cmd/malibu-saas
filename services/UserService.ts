/**
 * User Service - Database operations for user management
 */

import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { SubscriptionStatus } from '@prisma/client';
import { calculateTrialEndDate } from '@/lib/subscription';
import type { RegisterFormData, UserWithSubscription } from '@/types';

/**
 * Create a new user with trial subscription
 */
export async function createUser(data: RegisterFormData): Promise<UserWithSubscription> {
    // Check if email or TradingView username already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: data.email },
                { tradingViewUsername: data.tradingViewUsername }
            ]
        }
    });

    if (existingUser) {
        if (existingUser.email === data.email) {
            throw new Error('Email already registered');
        }
        throw new Error('TradingView username already registered');
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12);

    // Create user with pending approval subscription
    const user = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            tradingViewUsername: data.tradingViewUsername,
            subscription: {
                create: {
                    status: SubscriptionStatus.PENDING_APPROVAL,
                    trialUsed: false,
                }
            }
        },
        include: {
            subscription: true
        }
    });

    return user;
}

/**
 * Get user with subscription by ID
 */
export async function getUserWithSubscription(userId: string): Promise<UserWithSubscription | null> {
    return prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
    });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email }
    });
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, data: Partial<{ name: string; tradingViewUsername: string }>) {
    return prisma.user.update({
        where: { id: userId },
        data
    });
}
