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

-- 3. ENHANCE TRADES TABLE
-- Check if user_id and portfolio_id exist before adding
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='user_id') THEN
        ALTER TABLE public.trades ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trades' AND column_name='portfolio_id') THEN
        ALTER TABLE public.trades ADD COLUMN portfolio_id UUID REFERENCES public.portfolios ON DELETE CASCADE;
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

-- Trades
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only manage their own trades') THEN
        CREATE POLICY "Users can only manage their own trades" ON trades FOR ALL USING (auth.uid() = user_id);
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
