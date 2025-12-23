-- ============================================
-- Harmonik PRZ Malibu - Supabase SQL Setup
-- ============================================
-- Bu dosyayı Supabase SQL Editor'e yapıştırın ve "RUN" butonuna basın

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'PENDING_APPROVAL');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "email" TEXT UNIQUE NOT NULL,
    "emailVerified" TIMESTAMP,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "tradingview_username" TEXT UNIQUE NOT NULL,
    "role" "UserRole" DEFAULT 'USER' NOT NULL,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE "subscriptions" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "user_id" TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "status" "SubscriptionStatus" DEFAULT 'PENDING_APPROVAL' NOT NULL,
    "trial_used" BOOLEAN DEFAULT false NOT NULL,
    "start_date" TIMESTAMP,
    "end_date" TIMESTAMP,
    "admin_note" TEXT,
    "access_granted_at" TIMESTAMP,
    "access_granted_by" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- PAYMENT REQUESTS TABLE
-- ============================================

CREATE TABLE "payment_requests" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "txid" TEXT UNIQUE NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
    "payment_date" TIMESTAMP NOT NULL,
    "reviewed_at" TIMESTAMP,
    "reviewed_by" TEXT,
    "admin_note" TEXT,
    "requested_plan" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- NEXTAUTH TABLES
-- ============================================

CREATE TABLE "accounts" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    UNIQUE("provider", "provider_account_id")
);

CREATE TABLE "sessions" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "session_token" TEXT UNIQUE NOT NULL,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "expires" TIMESTAMP NOT NULL
);

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT UNIQUE NOT NULL,
    "expires" TIMESTAMP NOT NULL,
    UNIQUE("identifier", "token")
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX "payment_requests_status_idx" ON "payment_requests"("status");
CREATE INDEX "payment_requests_user_id_idx" ON "payment_requests"("user_id");

-- ============================================
-- AUTO UPDATE TIMESTAMP FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON "subscriptions" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON "payment_requests" FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA (Admin User + Test User)
-- ============================================

-- Admin user (Password: Admin123!)
INSERT INTO "users" ("id", "email", "password", "name", "tradingview_username", "role", "is_active")
VALUES (
    uuid_generate_v4()::TEXT,
    'admin@malibu.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeQPdH.Iq',
    'Admin',
    'malibu_admin',
    'ADMIN',
    true
);

-- Get admin user ID for subscription
DO $$
DECLARE
    admin_user_id TEXT;
BEGIN
    SELECT id INTO admin_user_id FROM "users" WHERE email = 'admin@malibu.com';
    
    INSERT INTO "subscriptions" ("user_id", "status", "start_date", "end_date", "trial_used")
    VALUES (admin_user_id, 'ACTIVE', NOW(), NULL, true);
END $$;

-- Test user (Password: Test123!)
INSERT INTO "users" ("id", "email", "password", "name", "tradingview_username", "role")
VALUES (
    uuid_generate_v4()::TEXT,
    'test@example.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Test User',
    'testuser123',
    'USER'
);

-- Get test user ID for subscription
DO $$
DECLARE
    test_user_id TEXT;
BEGIN
    SELECT id INTO test_user_id FROM "users" WHERE email = 'test@example.com';
    
    INSERT INTO "subscriptions" ("user_id", "status", "trial_used")
    VALUES (test_user_id, 'PENDING_APPROVAL', false);
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify installation
SELECT 'Database setup complete!' AS status;
SELECT COUNT(*) AS total_users FROM "users";
SELECT COUNT(*) AS total_subscriptions FROM "subscriptions";
