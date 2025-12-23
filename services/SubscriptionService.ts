/**
 * Subscription Service - Manage subscription lifecycle
 */

import prisma from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { calculateTrialEndDate, calculateSubscriptionEndDate, type PlanType } from '@/lib/subscription';

/**
 * Activate trial for a user (Admin action)
 */
export async function activateTrial(userId: string, adminId: string) {
    const subscription = await prisma.subscription.findUnique({
        where: { userId }
    });

    if (!subscription) {
        throw new Error('Subscription not found');
    }

    if (subscription.trialUsed) {
        throw new Error('User has already used their trial');
    }

    const now = new Date();
    const endDate = calculateTrialEndDate(now);

    return prisma.subscription.update({
        where: { userId },
        data: {
            status: SubscriptionStatus.TRIAL,
            startDate: now,
            endDate,
            trialUsed: true,
            accessGrantedAt: now,
            accessGrantedBy: adminId,
            adminNote: 'Trial activated by admin'
        }
    });
}

/**
 * Activate paid subscription (After payment approval)
 */
export async function activateSubscription(
    userId: string,
    plan: PlanType,
    adminId: string
) {
    const now = new Date();
    const endDate = calculateSubscriptionEndDate(now, plan);

    return prisma.subscription.update({
        where: { userId },
        data: {
            status: SubscriptionStatus.ACTIVE,
            startDate: now,
            endDate,
            accessGrantedAt: now,
            accessGrantedBy: adminId,
            adminNote: `${plan} subscription activated`
        }
    });
}

/**
 * Mark subscription as expired
 */
export async function expireSubscription(userId: string) {
    return prisma.subscription.update({
        where: { userId },
        data: {
            status: SubscriptionStatus.EXPIRED
        }
    });
}

/**
 * Get all users pending approval
 */
export async function getPendingApprovals() {
    return prisma.user.findMany({
        where: {
            subscription: {
                status: SubscriptionStatus.PENDING_APPROVAL
            }
        },
        include: {
            subscription: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

/**
 * Get all active subscriptions
 */
export async function getActiveSubscriptions() {
    return prisma.user.findMany({
        where: {
            subscription: {
                status: {
                    in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE]
                }
            }
        },
        include: {
            subscription: true
        }
    });
}

/**
 * Check and expire overdue subscriptions (Cron job)
 */
export async function expireOverdueSubscriptions() {
    const now = new Date();

    const result = await prisma.subscription.updateMany({
        where: {
            status: {
                in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE]
            },
            endDate: {
                lte: now
            }
        },
        data: {
            status: SubscriptionStatus.EXPIRED
        }
    });

    return result.count;
}
