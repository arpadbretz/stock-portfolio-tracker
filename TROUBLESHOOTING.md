# Troubleshooting: Trade Not Appearing

## Issue
- Trade submitted successfully (no error shown)
- Trade doesn't appear in holdings or trade history
- "Add Trade" button becomes unclickable after submission

## Root Cause
The database is missing the `total_cost` and `date_traded` columns that the updated API code is trying to insert.

## Solution

### Step 1: Run Database Migration in Supabase

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the ENTIRE contents of `setup.sql` from this project
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify Columns Were Added

Run this query in SQL Editor to check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trades' 
ORDER BY ordinal_position;
```

You should see these columns:
- `id`
- `user_id`
- `portfolio_id`
- `ticker`
- `action`
- `quantity`
- `price_per_share`
- `fees`
- `total_cost` ← **Must exist**
- `notes`
- `date_traded` ← **Must exist**
- `created_at`

### Step 3: Check RLS Policies

Run this to verify INSERT policy exists:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'trades';
```

You should see:
- `Users can select their own trades` (SELECT)
- `Users can insert their own trades` (INSERT)
- `Users can update their own trades` (UPDATE)
- `Users can delete their own trades` (DELETE)

### Step 4: Delete Test Trade (if it was inserted without columns)

If the trade was inserted but is missing data:

```sql
-- First, check what's in the trades table
SELECT * FROM trades WHERE ticker = 'AAPL';

-- If you see incomplete data, delete it
DELETE FROM trades WHERE ticker = 'AAPL' AND total_cost IS NULL;
```

### Step 5: Test Again

1. Refresh your webapp
2. Click "Add Trade"
3. Enter: AAPL, BUY, 100 shares, $100/share, $0 fees
4. Submit
5. Trade should now appear in both Holdings and Trade History

## Still Not Working?

### Check Browser Console for Errors

1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Share the error message

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Submit a trade
4. Look for the POST request to `/api/trades`
5. Click on it and check:
   - Status code (should be 200)
   - Response tab (look for error messages)
   - Preview tab (should show `success: true`)

### Manual Database Check

In Supabase SQL Editor:

```sql
-- Check if your user has a portfolio
SELECT * FROM portfolios WHERE user_id = auth.uid();

-- Check all trades for your user
SELECT * FROM trades WHERE user_id = auth.uid();

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'trades';
```
