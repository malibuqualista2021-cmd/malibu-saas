import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { approvePayment, rejectPayment } from '@/services/PaymentService';

const reviewSchema = z.object({
    paymentId: z.string(),
    action: z.enum(['approve', 'reject']),
    note: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Admin only'
            }, { status: 403 });
        }

        const body = await request.json();
        const { paymentId, action, note } = reviewSchema.parse(body);

        let result;
        if (action === 'approve') {
            result = await approvePayment(paymentId, session.user.id, note);
        } else {
            result = await rejectPayment(paymentId, session.user.id, note || 'Payment rejected');
        }

        return NextResponse.json({
            success: true,
            message: `Payment ${action}d successfully`,
            data: result
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to review payment'
        }, { status: 400 });
    }
}
