'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3, LogOut, Users, DollarSign, Clock, CheckCircle,
    Loader2, TrendingUp, AlertCircle, Copy, Check, X
} from 'lucide-react';
import { formatCurrency, formatDate, truncateTxid } from '@/lib/utils';

interface DashboardStats {
    totalUsers: number;
    activeSubscriptions: number;
    trialUsers: number;
    pendingPayments: number;
    pendingApprovals: number;
    revenue: { total: number; thisMonth: number };
}

interface User {
    id: string;
    email: string;
    name: string | null;
    tradingViewUsername: string;
    createdAt: string;
    subscription: {
        status: string;
        startDate: string | null;
        endDate: string | null;
    } | null;
}

interface PaymentRequest {
    id: string;
    txid: string;
    amount: number;
    requestedPlan: string;
    paymentDate: string;
    status: string;
    user: {
        email: string;
        tradingViewUsername: string;
    };
}

export default function AdminDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pendingApprovals, setPendingApprovals] = useState<User[]>([]);
    const [pendingPayments, setPendingPayments] = useState<PaymentRequest[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'payments' | 'users'>('overview');
    const [copiedTxid, setCopiedTxid] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, approvalsRes, paymentsRes, usersRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/users?type=pending-approvals'),
                fetch('/api/admin/users?type=pending-payments'),
                fetch('/api/admin/users?type=all')
            ]);

            const [statsData, approvalsData, paymentsData, usersData] = await Promise.all([
                statsRes.json(),
                approvalsRes.json(),
                paymentsRes.json(),
                usersRes.json()
            ]);

            if (statsData.success) setStats(statsData.data);
            if (approvalsData.success) setPendingApprovals(approvalsData.data);
            if (paymentsData.success) setPendingPayments(paymentsData.data);
            if (usersData.success) setAllUsers(usersData.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveTrial = async (userId: string) => {
        if (!confirm('Approve 7-day trial for this user?')) return;

        try {
            const response = await fetch('/api/admin/approve-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            if (data.success) {
                alert('Trial approved successfully!');
                fetchData();
            } else {
                alert(data.error || 'Failed to approve trial');
            }
        } catch (error) {
            alert('An error occurred');
        }
    };

    const handleReviewPayment = async (paymentId: string, action: 'approve' | 'reject') => {
        const note = action === 'reject' ? prompt('Rejection reason:') : undefined;
        if (action === 'reject' && !note) return;

        try {
            const response = await fetch('/api/admin/review-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, action, note })
            });

            const data = await response.json();
            if (data.success) {
                alert(`Payment ${action}d successfully!`);
                fetchData();
            } else {
                alert(data.error || 'Failed to review payment');
            }
        } catch (error) {
            alert('An error occurred');
        }
    };

    const handleCopyTxid = async (txid: string) => {
        const success = await navigator.clipboard.writeText(txid);
        if (success) {
            setCopiedTxid(txid);
            setTimeout(() => setCopiedTxid(null), 2000);
        }
    };

    const handleCopyUsernames = async () => {
        const activeUsers = allUsers.filter(u =>
            u.subscription?.status === 'TRIAL' || u.subscription?.status === 'ACTIVE'
        );
        const usernames = activeUsers.map(u => u.tradingViewUsername).join('\n');

        await navigator.clipboard.writeText(usernames);
        alert(`Copied ${activeUsers.length} active usernames to clipboard!`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
            {/* Header */}
            <nav className="border-b border-border/40 glass">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold gradient-text">Admin Panel</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Badge variant="secondary">ADMIN</Badge>
                        <span className="text-sm text-muted-foreground">{session?.user?.email}</span>
                        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Tabs */}
                <div className="flex space-x-2 mb-6 border-b border-border/40 pb-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'approvals', label: `Approvals (${pendingApprovals.length})`, icon: Clock },
                        { id: 'payments', label: `Payments (${pendingPayments.length})`, icon: DollarSign },
                        { id: 'users', label: 'All Users', icon: Users }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                }`}
                        >
                            <tab.icon className="h-4 w-4 inline mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="glass">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                </CardContent>
                            </Card>

                            <Card className="glass">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-400">{stats.activeSubscriptions}</div>
                                </CardContent>
                            </Card>

                            <Card className="glass">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
                                    <Clock className="h-4 w-4 text-blue-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-400">{stats.trialUsers}</div>
                                </CardContent>
                            </Card>

                            <Card className="glass neon-glow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-primary">{formatCurrency(stats.revenue.total)}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(stats.revenue.thisMonth)} this month
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle>Pending Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                        <div className="flex items-center space-x-2">
                                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                                            <span className="font-medium">Trial Approvals</span>
                                        </div>
                                        <Badge variant="pending">{stats.pendingApprovals}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/30">
                                        <div className="flex items-center space-x-2">
                                            <DollarSign className="h-5 w-5 text-primary" />
                                            <span className="font-medium">Payment Verifications</span>
                                        </div>
                                        <Badge variant="default">{stats.pendingPayments}</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass">
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => setActiveTab('approvals')}
                                    >
                                        <Clock className="h-4 w-4 mr-2" />
                                        Review Pending Approvals ({pendingApprovals.length})
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => setActiveTab('payments')}
                                    >
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        Verify Payments ({pendingPayments.length})
                                    </Button>
                                    <Button
                                        variant="neon"
                                        className="w-full justify-start"
                                        onClick={handleCopyUsernames}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Active TradingView Usernames
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Pending Approvals Tab */}
                {activeTab === 'approvals' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Pending Trial Approvals</h2>
                        {pendingApprovals.length === 0 ? (
                            <Card className="glass">
                                <CardContent className="py-12 text-center">
                                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No pending approvals</p>
                                </CardContent>
                            </Card>
                        ) : (
                            pendingApprovals.map((user) => (
                                <Card key={user.id} className="glass">
                                    <CardContent className="flex items-center justify-between p-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-medium">{user.email}</h3>
                                                <Badge variant="pending">PENDING</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                TradingView: <span className="font-mono text-primary">{user.tradingViewUsername}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Registered: {formatDate(user.createdAt)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="neon"
                                            onClick={() => handleApproveTrial(user.id)}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve Trial
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Pending Payments Tab */}
                {activeTab === 'payments' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Pending Payment Verifications</h2>
                        {pendingPayments.length === 0 ? (
                            <Card className="glass">
                                <CardContent className="py-12 text-center">
                                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No pending payments</p>
                                </CardContent>
                            </Card>
                        ) : (
                            pendingPayments.map((payment) => (
                                <Card key={payment.id} className="glass">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-medium">{payment.user.email}</h3>
                                                    <Badge variant="pending">PENDING</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    TradingView: <span className="font-mono text-primary">{payment.user.tradingViewUsername}</span>
                                                </p>
                                                <p className="text-sm">
                                                    Amount: <span className="font-bold text-primary">{formatCurrency(payment.amount)}</span>
                                                    {' • '}
                                                    Plan: <span className="font-medium">{payment.requestedPlan}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Submitted: {formatDate(payment.paymentDate)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-lg bg-muted/30 border border-border">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">TRANSACTION ID:</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopyTxid(payment.txid)}
                                                >
                                                    {copiedTxid === payment.txid ? (
                                                        <Check className="h-3 w-3 text-green-400" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                            <p className="font-mono text-xs break-all">{payment.txid}</p>
                                            <a
                                                href={`https://tronscan.org/#/transaction/${payment.txid}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline mt-2 inline-block"
                                            >
                                                View on Tronscan →
                                            </a>
                                        </div>

                                        <div className="flex space-x-2">
                                            <Button
                                                variant="neon"
                                                className="flex-1"
                                                onClick={() => handleReviewPayment(payment.id, 'approve')}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve & Activate
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="flex-1"
                                                onClick={() => handleReviewPayment(payment.id, 'reject')}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Reject
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* All Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">All Users ({allUsers.length})</h2>
                            <Button variant="outline" onClick={handleCopyUsernames}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Active Usernames
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {allUsers.map((user) => (
                                <Card key={user.id} className="glass">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">{user.email}</span>
                                                <Badge
                                                    variant={
                                                        user.subscription?.status === 'ACTIVE' ? 'active' :
                                                            user.subscription?.status === 'TRIAL' ? 'trial' :
                                                                user.subscription?.status === 'EXPIRED' ? 'expired' :
                                                                    'pending'
                                                    }
                                                >
                                                    {user.subscription?.status || 'NO_SUB'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                TV: <span className="font-mono text-primary">{user.tradingViewUsername}</span>
                                                {user.subscription?.endDate && (
                                                    <> • Expires: {formatDate(user.subscription.endDate)}</>
                                                )}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
