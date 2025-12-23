# Malibu SaaS - Project Structure

## Directory Tree

```
malibu-saas/
├── prisma/
│   ├── schema.prisma              # Database schema (PostgreSQL)
│   └── seed.ts                    # Seed data (admin user, test users)
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Auth routes group
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # Login page
│   │   │   └── register/
│   │   │       └── page.tsx       # Registration page
│   │   │
│   │   ├── (dashboard)/           # Protected routes group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # User dashboard
│   │   │   ├── payment/
│   │   │   │   └── page.tsx       # Payment submission page
│   │   │   └── layout.tsx         # Dashboard layout
│   │   │
│   │   ├── admin/                 # Admin panel
│   │   │   ├── page.tsx           # Admin dashboard
│   │   │   ├── users/
│   │   │   │   └── page.tsx       # User management
│   │   │   ├── payments/
│   │   │   │   └── page.tsx       # Payment approvals
│   │   │   └── approvals/
│   │   │       └── page.tsx       # Access approvals
│   │   │
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts   # NextAuth.js configuration
│   │   │   ├── user/
│   │   │   │   └── subscription/
│   │   │   │       └── route.ts   # Get subscription status
│   │   │   ├── payment/
│   │   │   │   ├── submit/
│   │   │   │   │   └── route.ts   # Submit payment TXID
│   │   │   │   └── verify/
│   │   │   │       └── route.ts   # Admin verify payment
│   │   │   └── admin/
│   │   │       ├── users/
│   │   │       │   └── route.ts   # Admin user operations
│   │   │       └── approve/
│   │   │           └── route.ts   # Approve trial access
│   │   │
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page
│   │   └── globals.css            # Global styles (Tailwind)
│   │
│   ├── components/                # React Components
│   │   ├── ui/                    # Shadcn/UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   ├── dashboard/             # Dashboard-specific
│   │   │   ├── SubscriptionCard.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   └── StatusBadge.tsx
│   │   │
│   │   ├── admin/                 # Admin panel components
│   │   │   ├── UserTable.tsx
│   │   │   ├── PaymentReviewTable.tsx
│   │   │   ├── ApprovalQueue.tsx
│   │   │   └── StatsCard.tsx
│   │   │
│   │   └── shared/                # Shared components
│   │       ├── PricingTable.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── lib/                       # Utilities & Configuration
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── subscription.ts        # Subscription logic functions
│   │   ├── utils.ts               # General utilities (cn, etc.)
│   │   └── validations.ts         # Zod schemas
│   │
│   ├── services/                  # Business Logic Layer
│   │   ├── UserService.ts         # User CRUD operations
│   │   ├── SubscriptionService.ts # Subscription management
│   │   ├── PaymentService.ts      # Payment processing
│   │   └── AdminService.ts        # Admin operations
│   │
│   └── types/                     # TypeScript types
│       └── index.ts               # Centralized type exports
│
├── public/                        # Static assets
│   ├── images/
│   │   └── logo.png
│   └── favicon.ico
│
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment template
├── .gitignore
├── next.config.js                 # Next.js configuration
├── package.json
├── tailwind.config.ts             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
└── README.md                      # Project documentation
```

## Key Architecture Decisions

### 1. Route Groups
- `(auth)`: Public authentication pages
- `(dashboard)`: Protected user pages
- `admin`: Admin-only panel

### 2. Service Layer
Separates business logic from API routes:
- **UserService**: Registration, profile updates
- **SubscriptionService**: Trial activation, status checks
- **PaymentService**: TXID submission, verification
- **AdminService**: Approval workflows, user management

### 3. Component Organization
- **ui/**: Reusable Shadcn components
- **layout/**: Page structure components
- **dashboard/**: User-facing features
- **admin/**: Admin panel features
- **shared/**: Cross-cutting components

### 4. Type Safety
- Prisma generates types from schema
- Extended types in `src/types/index.ts`
- Zod for runtime validation

### 5. API Structure
RESTful pattern:
- `POST /api/payment/submit` - User submits TXID
- `GET /api/user/subscription` - Check status
- `POST /api/admin/approve` - Admin approves access
