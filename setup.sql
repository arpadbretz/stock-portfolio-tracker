-- 1. PROFILES TABLE (Extensions to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  preferred_currency TEXT DEFAULT 'USD' CHECK (preferred_currency IN ('USD', 'EUR', 'HUF')),
  theme TEXT DEFAULT 'dark',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PORTFOLIOS TABLE
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Main Portfolio',
  description TEXT,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TRADES TABLE (Complete Definition)
CREATE TABLE IF NOT EXISTS public.trades (
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
  date_traded TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns if table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='user_id') THEN
        ALTER TABLE public.trades ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='portfolio_id') THEN
        ALTER TABLE public.trades ADD COLUMN portfolio_id UUID REFERENCES public.portfolios ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='total_cost') THEN
        ALTER TABLE public.trades ADD COLUMN total_cost DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='date_traded') THEN
        ALTER TABLE public.trades ADD COLUMN date_traded TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 4. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES (Users can only see THEIR data)
-- Profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only view their own profile') THEN
        CREATE POLICY "Users can only view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only update their own profile') THEN
        CREATE POLICY "Users can only update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Portfolios
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only manage their own portfolios') THEN
        CREATE POLICY "Users can only manage their own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Trades (Separate policies for each operation to ensure INSERT works)
DO $$
BEGIN
    -- Drop the old combined policy if it exists
    DROP POLICY IF EXISTS "Users can only manage their own trades" ON trades;
    
    -- SELECT: Users can only see their own trades
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can select their own trades') THEN
        CREATE POLICY "Users can select their own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- INSERT: Users can only insert trades for themselves
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own trades') THEN
        CREATE POLICY "Users can insert their own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- UPDATE: Users can only update their own trades
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own trades') THEN
        CREATE POLICY "Users can update their own trades" ON trades FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- DELETE: Users can only delete their own trades
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own trades') THEN
        CREATE POLICY "Users can delete their own trades" ON trades FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  INSERT INTO public.portfolios (user_id, name, is_default)
  VALUES (new.id, 'My Portfolio', true);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
