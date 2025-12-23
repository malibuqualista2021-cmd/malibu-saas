import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAdminStats } from '@/services/AdminService';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Admin only'
            }, { status: 403 });
        }

        const stats = await getAdminStats();

        return NextResponse.json({
            success: true,
            data: stats
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch stats'
        }, { status: 500 });
    }
}
