/**
 * Subscription Logic & State Machine
 * Handles: Trial expiration, subscription status, access control
 */

import { Subscription, SubscriptionStatus } from '@prisma/client';
import { addDays, isPast, isAfter, isBefore } from 'date-fns';

// ============================================
// CONSTANTS
// ============================================

export const TRIAL_DURATION_DAYS = 7;

export const SUBSCRIPTION_PLANS = {
    monthly: { days: 30, priceUSD: 49 },
    yearly: { days: 365, priceUSD: 399 },
    lifetime: { days: null, priceUSD: 999 }, // null = no expiration
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;

// ============================================
// CORE LOGIC FUNCTIONS
// ============================================

/**
 * Check if a subscription is currently valid
 * Returns true if user should have access to the indicator
 */
export function isSubscriptionActive(subscription: Subscription | null): boolean {
    if (!subscription) return false;

    // Must be in TRIAL or ACTIVE status
    if (subscription.status !== SubscriptionStatus.TRIAL &&
        subscription.status !== SubscriptionStatus.ACTIVE) {
        return false;
    }

    // If no end date (lifetime), always active
    if (!subscription.endDate) return true;

    // Check if current date is before expiration
    return isBefore(new Date(), subscription.endDate);
}

/**
 * Check if trial period has expired
 */
export function isTrialExpired(subscription: Subscription | null): boolean {
    if (!subscription) return false;
    if (subscription.status !== SubscriptionStatus.TRIAL) return false;
    if (!subscription.endDate) return false;

    return isPast(subscription.endDate);
}

/**
 * Calculate trial end date (7 days from start)
 */
export function calculateTrialEndDate(startDate: Date = new Date()): Date {
    return addDays(startDate, TRIAL_DURATION_DAYS);
}

/**
 * Calculate subscription end date based on plan
 */
export function calculateSubscriptionEndDate(
    startDate: Date,
    plan: PlanType
): Date | null {
    const planConfig = SUBSCRIPTION_PLANS[plan];

    if (planConfig.days === null) {
        return null; // Lifetime subscription
    }

    return addDays(startDate, planConfig.days);
}

/**
 * Get remaining days in subscription
 */
export function getRemainingDays(subscription: Subscription | null): number | null {
    if (!subscription?.endDate) return null;

    const now = new Date();
    const end = subscription.endDate;

    if (isPast(end)) return 0;

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Get user-friendly subscription status message
 */
export function getSubscriptionStatusMessage(subscription: Subscription | null): string {
    if (!subscription) {
        return 'No subscription found';
    }

    switch (subscription.status) {
        case SubscriptionStatus.PENDING_APPROVAL:
            return 'Waiting for admin approval to start trial';

        case SubscriptionStatus.TRIAL: {
            const remaining = getRemainingDays(subscription);
            if (remaining === null) return 'Trial active';
            if (remaining <= 0) return 'Trial expired';
            return `Trial: ${remaining} day${remaining === 1 ? '' : 's'} remaining`;
        }

        case SubscriptionStatus.ACTIVE: {
            const remaining = getRemainingDays(subscription);
            if (remaining === null) return 'Lifetime subscription active';
            if (remaining <= 0) return 'Subscription expired';
            if (remaining <= 7) return `Expiring soon: ${remaining} day${remaining === 1 ? '' : 's'} left`;
            return `Active until ${subscription.endDate?.toLocaleDateString()}`;
        }

        case SubscriptionStatus.EXPIRED:
            return 'Subscription expired - Renew to continue access';

        default:
            return 'Unknown status';
    }
}

/**
 * Determine if user needs admin approval
 */
export function needsAdminApproval(subscription: Subscription | null): boolean {
    return subscription?.status === SubscriptionStatus.PENDING_APPROVAL;
}

/**
 * Validate TXID format (basic TRC20 transaction hash validation)
 */
export function isValidTXID(txid: string): boolean {
    // TRC20 transaction hashes are 64 character hex strings
    const txidRegex = /^[a-fA-F0-9]{64}$/;
    return txidRegex.test(txid);
}

/**
 * Get suggested plan based on requested duration
 */
export function getPlanFromRequest(requestedPlan: string | null): PlanType {
    const plan = requestedPlan?.toLowerCase();

    if (plan === 'yearly') return 'yearly';
    if (plan === 'lifetime') return 'lifetime';

    return 'monthly'; // Default
}
