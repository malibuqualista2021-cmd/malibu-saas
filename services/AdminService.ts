/**
 * Admin Service - Admin-specific operations and statistics
 */

import prisma from '@/lib/prisma';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';
import type { DashboardStats } from '@/types';

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<DashboardStats> {
    const [
        totalUsers,
        activeSubscriptions,
        trialUsers,
        pendingPayments,
        pendingApprovals,
        approvedPayments
    ] = await Promise.all([
        // Total users
        prisma.user.count(),

        // Active subscriptions
        prisma.subscription.count({
            where: { status: SubscriptionStatus.ACTIVE }
        }),

        // Trial users
        prisma.subscription.count({
            where: { status: SubscriptionStatus.TRIAL }
        }),

        // Pending payments
        prisma.paymentRequest.count({
            where: { status: PaymentStatus.PENDING }
        }),

        // Pending approvals
        prisma.subscription.count({
            where: { status: SubscriptionStatus.PENDING_APPROVAL }
        }),

        // All approved payments
        prisma.paymentRequest.findMany({
            where: { status: PaymentStatus.APPROVED },
            select: { amount: true, reviewedAt: true }
        })
    ]);

    // Calculate revenue
    const totalRevenue = approvedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = approvedPayments
        .filter(p => p.reviewedAt && p.reviewedAt >= firstDayOfMonth)
        .reduce((sum, payment) => sum + payment.amount, 0);

    return {
        totalUsers,
        activeSubscriptions,
        trialUsers,
        pendingPayments,
        pendingApprovals,
        revenue: {
            total: totalRevenue,
            thisMonth: thisMonthRevenue
        }
    };
}

/**
 * Get all users with their subscription status
 */
export async function getAllUsers() {
    return prisma.user.findMany({
        include: {
            subscription: true,
            paymentRequests: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

/**
 * Export TradingView usernames for active users
 * Admin can copy this list to manually add to TradingView
 */
export async function exportActiveUsernames() {
    const users = await prisma.user.findMany({
        where: {
            subscription: {
                status: {
                    in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE]
                }
            }
        },
        select: {
            tradingViewUsername: true,
            subscription: {
                select: {
                    status: true,
                    endDate: true
                }
            }
        },
        orderBy: {
            tradingViewUsername: 'asc'
        }
    });

    return users.map(u => ({
        username: u.tradingViewUsername,
        status: u.subscription?.status,
        expiresAt: u.subscription?.endDate
    }));
}

/**
 * Manually toggle user active status (emergency suspend)
 */
export async function toggleUserStatus(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive }
    });
}
