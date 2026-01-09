-- COMPLETE DATABASE RESET AND SETUP
-- Run this ENTIRE script in Supabase SQL Editor (all at once)
-- This will clean up the mess and create everything correctly

-- ============================================
-- STEP 1: DROP EXISTING TABLES (in correct order due to foreign keys)
-- ============================================
DROP TABLE IF EXISTS public.trades CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- STEP 2: CREATE TABLES IN CORRECT ORDER
-- ============================================

-- 1. PROFILES TABLE (Extensions to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  preferred_currency TEXT DEFAULT 'USD' CHECK (preferred_currency IN ('USD', 'EUR', 'HUF')),
  theme TEXT DEFAULT 'dark',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PORTFOLIOS TABLE
CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Main Portfolio',
  description TEXT,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TRADES TABLE (Complete with ALL columns)
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  portfolio_id UUID REFERENCES public.portfolios ON DELETE CASCADE NOT NULL,
  ticker TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
  quantity DECIMAL NOT NULL CHECK (quantity > 0),
  price_per_share DECIMAL NOT NULL CHECK (price_per_share > 0),
  fees DECIMAL DEFAULT 0,
  total_cost DECIMAL,
  notes TEXT,
  date_traded TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE RLS POLICIES
-- ============================================

-- Profiles Policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Portfolios Policies
CREATE POLICY "Users can view their own portfolios" 
  ON public.portfolios FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolios" 
  ON public.portfolios FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" 
  ON public.portfolios FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" 
  ON public.portfolios FOR DELETE 
  USING (auth.uid() = user_id);

-- Trades Policies (Separate for each operation)
CREATE POLICY "Users can select their own trades" 
  ON public.trades FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" 
  ON public.trades FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" 
  ON public.trades FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" 
  ON public.trades FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: AUTO-CREATE PROFILE & PORTFOLIO ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Create default portfolio
  INSERT INTO public.portfolios (user_id, name, is_default)
  VALUES (new.id, 'My Portfolio', true);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 6: CREATE PORTFOLIO FOR EXISTING USERS
-- ============================================
-- This ensures your current user has a portfolio
INSERT INTO public.portfolios (user_id, name, is_default)
SELECT 
  id,
  'My Portfolio',
  true
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.portfolios WHERE user_id = auth.users.id
);

-- ============================================
-- VERIFICATION QUERIES (Run after to confirm)
-- ============================================

-- Check trades table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'trades' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('profiles', 'portfolios', 'trades')
ORDER BY tablename, cmd;

-- Check your portfolio exists
SELECT id, name, is_default, created_at
FROM portfolios 
WHERE user_id = auth.uid();
