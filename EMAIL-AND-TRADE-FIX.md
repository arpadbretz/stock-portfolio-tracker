# Email Confirmation 404 Fix

## Problem
When users click the email confirmation link, they get a 404 error.

## Root Cause
Supabase email templates are using the wrong redirect URL.

## Solution

### Step 1: Update Supabase Email Templates

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**

2. Find the **"Confirm signup"** template

3. Update the confirmation link URL to:
   ```
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
   ```

4. The full template should look like:
   ```html
   <h2>Confirm your signup</h2>

   <p>Follow this link to confirm your account:</p>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirm your email</a></p>
   ```

### Step 2: Update Site URL in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

2. Set **Site URL** to your production URL:
   - Production: `https://your-app.netlify.app`
   - Local dev: `http://localhost:3000`

3. Add **Redirect URLs** (one per line):
   ```
   https://your-app.netlify.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### Step 3: Update Register Page (Already Fixed)

The register page now correctly sets the email redirect:

```typescript
const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
});
```

### Step 4: Test Email Confirmation

1. Register a new account with a different email
2. Check your email
3. Click the confirmation link
4. You should be redirected to the main page (logged in)

---

# Cannot Add Trades Fix

## Diagnostic Steps

### 1. Check Browser Console

1. Open your webapp
2. Press F12 to open DevTools
3. Go to **Console** tab
4. Try to add a trade
5. Look for error messages (red text)
6. **Share the error message with me**

### 2. Check Network Tab

1. In DevTools, go to **Network** tab
2. Try to add a trade
3. Look for the POST request to `/api/trades`
4. Click on it
5. Go to **Response** tab
6. **Share what you see**

### 3. Check Netlify Logs

1. Go to **Netlify Dashboard**
2. Click on your site
3. Go to **Logs** → **Functions**
4. Try to add a trade
5. Look for errors in the logs
6. **Share any error messages**

## Common Issues

### Issue 1: Portfolio Not Created

Run this in Supabase SQL Editor:

```sql
-- Check if you have a portfolio
SELECT * FROM portfolios WHERE user_id = auth.uid();

-- If empty, create one manually:
INSERT INTO portfolios (user_id, name, is_default)
VALUES (auth.uid(), 'My Portfolio', true);
```

### Issue 2: RLS Policy Blocking Insert

Run this in Supabase SQL Editor:

```sql
-- Check RLS policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'trades';

-- Should show:
-- "Users can insert their own trades" | INSERT
```

### Issue 3: Missing Columns

Run this in Supabase SQL Editor:

```sql
-- Verify all columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'trades' 
ORDER BY ordinal_position;

-- Should include: total_cost, date_traded, created_at
```

---

## Next Steps

1. **For email issue**: Update Supabase email templates (see Step 1 above)
2. **For trade issue**: Run the diagnostic queries and share the results
