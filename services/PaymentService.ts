/**
 * Payment Service - Handle payment requests and verification
 */

import prisma from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
import { isValidTXID, type PlanType } from '@/lib/subscription';
import type { PaymentRequestFormData } from '@/types';

/**
 * Submit a payment request (User action)
 */
export async function submitPaymentRequest(
    userId: string,
    data: PaymentRequestFormData
) {
    // Validate TXID format
    if (!isValidTXID(data.txid)) {
        throw new Error('Invalid transaction ID format');
    }

    // Check if TXID already exists
    const existingPayment = await prisma.paymentRequest.findUnique({
        where: { txid: data.txid }
    });

    if (existingPayment) {
        throw new Error('This transaction ID has already been submitted');
    }

    // Create payment request
    return prisma.paymentRequest.create({
        data: {
            userId,
            txid: data.txid,
            amount: data.amount,
            requestedPlan: data.requestedPlan,
            paymentDate: new Date(),
            status: PaymentStatus.PENDING
        }
    });
}

/**
 * Approve payment and activate subscription (Admin action)
 */
export async function approvePayment(
    paymentId: string,
    adminId: string,
    note?: string
) {
    const payment = await prisma.paymentRequest.findUnique({
        where: { id: paymentId },
        include: { user: true }
    });

    if (!payment) {
        throw new Error('Payment request not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
        throw new Error('Payment has already been processed');
    }

    // Update payment status
    await prisma.paymentRequest.update({
        where: { id: paymentId },
        data: {
            status: PaymentStatus.APPROVED,
            reviewedAt: new Date(),
            reviewedBy: adminId,
            adminNote: note || 'Payment verified and approved'
        }
    });

    // Activate subscription based on requested plan
    const plan = (payment.requestedPlan || 'monthly') as PlanType;
    const now = new Date();
    const endDate = getEndDateForPlan(now, plan);

    await prisma.subscription.update({
        where: { userId: payment.userId },
        data: {
            status: 'ACTIVE',
            startDate: now,
            endDate,
            accessGrantedAt: now,
            accessGrantedBy: adminId,
            adminNote: `Activated via payment ${payment.txid.substring(0, 8)}...`
        }
    });

    return payment;
}

/**
 * Reject payment request (Admin action)
 */
export async function rejectPayment(
    paymentId: string,
    adminId: string,
    reason: string
) {
    const payment = await prisma.paymentRequest.findUnique({
        where: { id: paymentId }
    });

    if (!payment) {
        throw new Error('Payment request not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
        throw new Error('Payment has already been processed');
    }

    return prisma.paymentRequest.update({
        where: { id: paymentId },
        data: {
            status: PaymentStatus.REJECTED,
            reviewedAt: new Date(),
            reviewedBy: adminId,
            adminNote: reason
        }
    });
}

/**
 * Get pending payment requests
 */
export async function getPendingPayments() {
    return prisma.paymentRequest.findMany({
        where: {
            status: PaymentStatus.PENDING
        },
        include: {
            user: true
        },
        orderBy: {
            paymentDate: 'desc'
        }
    });
}

/**
 * Get user's payment history
 */
export async function getUserPayments(userId: string) {
    return prisma.paymentRequest.findMany({
        where: { userId },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

// Helper function
function getEndDateForPlan(startDate: Date, plan: PlanType): Date | null {
    const planDays: Record<PlanType, number | null> = {
        monthly: 30,
        yearly: 365,
        lifetime: null
    };

    const days = planDays[plan];
    if (days === null) return null;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);
    return endDate;
}
