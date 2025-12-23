/**
 * TypeScript Type Definitions
 */

import { User, Subscription, PaymentRequest, UserRole, SubscriptionStatus, PaymentStatus } from '@prisma/client';

// ============================================
// EXTENDED MODELS (With Relations)
// ============================================

export type UserWithSubscription = User & {
    subscription: Subscription | null;
};

export type UserWithPayments = User & {
    paymentRequests: PaymentRequest[];
};

export type FullUser = User & {
    subscription: Subscription | null;
    paymentRequests: PaymentRequest[];
};

export type PaymentWithUser = PaymentRequest & {
    user: User;
};

// ============================================
// FORM INPUTS
// ============================================

export interface RegisterFormData {
    email: string;
    password: string;
    confirmPassword: string;
    tradingViewUsername: string;
    name?: string;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface PaymentRequestFormData {
    txid: string;
    amount: number;
    requestedPlan: 'monthly' | 'yearly' | 'lifetime';
}

export interface AdminApprovalData {
    subscriptionId: string;
    action: 'approve' | 'reject';
    note?: string;
}

export interface AdminPaymentReviewData {
    paymentId: string;
    action: 'approve' | 'reject';
    note?: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface SubscriptionStatusResponse {
    status: SubscriptionStatus;
    isActive: boolean;
    remainingDays: number | null;
    message: string;
    needsApproval: boolean;
}

export interface DashboardStats {
    totalUsers: number;
    activeSubscriptions: number;
    trialUsers: number;
    pendingPayments: number;
    pendingApprovals: number;
    revenue: {
        total: number;
        thisMonth: number;
    };
}

// Re-export Prisma enums for convenience
export { UserRole, SubscriptionStatus, PaymentStatus };
