-- ===================================================================================
-- SkillSwap+ Admin Dashboard Schema Update
-- Safely adds missing tables and columns for the Admin Dashboard to your existing ERD.
-- DOES NOT drop any of your existing tables.
-- ===================================================================================

-- 1. Safely create Enums if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('Active', 'Pending', 'Suspended');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_status') THEN
        CREATE TYPE course_status AS ENUM ('Pending', 'Active', 'Suspended');
    END IF;
END$$;

-- 2. Update existing profiles table to include status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='status') THEN
        ALTER TABLE public.profiles ADD COLUMN status user_status DEFAULT 'Active';
    END IF;
END$$;

-- 3. Create missing tables

-- COURSES
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  price_credits INTEGER DEFAULT 0,
  status course_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREDIT WALLETS
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREDIT TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Earned', 'Spent', 'Refund', 'Bonus', 'Adjustment')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Set RLS Policies (Optional but recommended)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Note: In a production environment, you would define strict policies using `CREATE POLICY`.
