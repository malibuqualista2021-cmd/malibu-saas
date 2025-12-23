# Harmonik PRZ Malibu - SaaS Platform

> Premium TradingView indicator subscription platform with automated trial management and TRC20 crypto payments.

## 🎯 Features

- ✅ **Secure Invite-Only Protection**: Indicator source code never exposed
- ✅ **7-Day Free Trial**: Automatic trial activation with admin approval
- ✅ **TRC20 USDT Payments**: Blockchain-based payment verification
- ✅ **Admin Dashboard**: Manage users, approve trials, verify payments
- ✅ **Semi-Automated Workflow**: Minimal admin effort, maximum security

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js with credential provider
- **Payments**: TRC20 USDT on Tron blockchain

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- TRC20 USDT wallet address

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd malibu-saas
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/malibu_saas"
NEXTAUTH_SECRET="your-secret-key-here"
TRON_WALLET_ADDRESS="YOUR_TRC20_USDT_ADDRESS"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate

# Seed with admin user
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

## 🔑 Default Login

After seeding:
- **Admin**: `admin@malibu.com` / `ChangeThisPassword123!`
- **Test User**: `test@example.com` / `Test123!`

## 📊 Database Schema

```
User
├── email (unique)
├── password (hashed)
├── tradingViewUsername (unique)
├── role (USER | ADMIN)
└── Subscription (1-to-1)
    ├── status (PENDING_APPROVAL | TRIAL | ACTIVE | EXPIRED)
    ├── startDate
    ├── endDate
    └── PaymentRequests (1-to-many)
        ├── txid (unique)
        ├── amount
        ├── status (PENDING | APPROVED | REJECTED)
        └── requestedPlan
```

## 🔄 User Journey

### New User Registration
1. User visits landing page
2. Clicks "Start 7-Day Trial"
3. Enters email, password, TradingView username
4. Account created with `PENDING_APPROVAL` status

### Admin Approves Trial
1. Admin logs in to dashboard
2. Sees pending approval requests
3. Clicks "Approve" → User status becomes `TRIAL`
4. User gets 7 days access

### Trial Expires
1. After 7 days, status auto-changes to `EXPIRED`
2. User sees subscription expired message
3. User clicks "Subscribe Now"

### Payment & Activation
1. User selects plan (Monthly/Yearly/Lifetime)
2. System shows TRC20 wallet address
3. User sends USDT, submits TXID
4. Admin verifies transaction on blockchain
5. Admin approves → User status becomes `ACTIVE`

## 🎨 Admin Panel Features

- **Dashboard Stats**: Total users, active subscriptions, revenue
- **Pending Approvals**: Approve/reject trial requests
- **Payment Review**: Verify and approve TXID submissions
- **User Management**: View all users, suspend accounts
- **Export Usernames**: Get list of active TradingView usernames to manually add to invite-only script

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes (dev)
npm run db:migrate       # Run migrations (prod)
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:seed          # Seed database

# Production
npm run build            # Build for production
npm run start            # Start production server
```

## 📁 Project Structure

```
malibu-saas/
├── prisma/              # Database schema & migrations
├── src/
│   ├── app/             # Next.js pages & API routes
│   ├── components/      # React components
│   ├── lib/             # Utilities & configs
│   ├── services/        # Business logic
│   └── types/           # TypeScript types
├── public/              # Static assets
└── ...config files
```

See `PROJECT_STRUCTURE.md` for detailed structure.

## 🔐 Security Best Practices

- ✅ Passwords hashed with bcrypt
- ✅ TXID uniqueness enforced at database level
- ✅ Admin-only routes protected
- ✅ SQL injection prevention via Prisma
- ✅ CSRF protection via NextAuth

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database Hosting

- **Vercel Postgres**: Integrated solution
- **Supabase**: Free PostgreSQL with dashboard
- **Railway**: Easy PostgreSQL hosting

## 📝 TODO

- [ ] Email notifications (trial expiration, payment confirmation)
- [ ] Frontend pages (landing, dashboard, admin panel)
- [ ] Shadcn/UI component integration
- [ ] Payment TXID blockchain verification
- [ ] User profile management
- [ ] Subscription renewal flow

## 💬 Support

For issues or questions, contact: [your-email@example.com]

## 📄 License

Proprietary - Harmonik PRZ Malibu © 2024
