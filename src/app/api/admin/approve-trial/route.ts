import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { activateTrial } from '@/services/SubscriptionService';

const approveSchema = z.object({
    userId: z.string(),
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
        const { userId } = approveSchema.parse(body);

        const subscription = await activateTrial(userId, session.user.id);

        return NextResponse.json({
            success: true,
            message: '7-day trial activated successfully',
            data: subscription
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to approve trial'
        }, { status: 400 });
    }
}
