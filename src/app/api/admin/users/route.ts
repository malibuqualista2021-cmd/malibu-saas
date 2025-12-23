import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPendingApprovals } from '@/services/SubscriptionService';
import { getPendingPayments } from '@/services/PaymentService';
import { getAllUsers } from '@/services/AdminService';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Admin only'
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        switch (type) {
            case 'pending-approvals':
                const pendingApprovals = await getPendingApprovals();
                return NextResponse.json({ success: true, data: pendingApprovals });

            case 'pending-payments':
                const pendingPayments = await getPendingPayments();
                return NextResponse.json({ success: true, data: pendingPayments });

            case 'all':
            default:
                const allUsers = await getAllUsers();
                return NextResponse.json({ success: true, data: allUsers });
        }

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch users'
        }, { status: 500 });
    }
}
