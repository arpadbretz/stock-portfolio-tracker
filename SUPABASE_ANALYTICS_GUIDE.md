# How to View Analytics in Supabase

## 📊 Viewing Ticker Analytics

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Queries

#### See Recent Ticker Views
```sql
SELECT 
  metadata->>'ticker' as ticker,
  session_hash,
  created_at
FROM analytics_events 
WHERE event_type = 'ticker_view'
ORDER BY created_at DESC 
LIMIT 20;
```

#### See Most Popular Tickers (24 hours)
```sql
SELECT 
  metadata->>'ticker' as ticker,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_hash) as unique_viewers
FROM analytics_events 
WHERE event_type = 'ticker_view'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY metadata->>'ticker'
ORDER BY view_count DESC
LIMIT 10;
```

#### See Recent Searches
```sql
SELECT 
  metadata->>'query' as search_query,
  session_hash,
  created_at
FROM analytics_events 
WHERE event_type = 'ticker_search'
ORDER BY created_at DESC
LIMIT 20;
```

#### See Most Searched Terms
```sql
SELECT 
  metadata->>'query' as search_query,
  COUNT(*) as search_count
FROM analytics_events 
WHERE event_type = 'ticker_search'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY metadata->>'query'
ORDER BY search_count DESC
LIMIT 10;
```

#### Daily Active Users
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT session_hash) as unique_users,
  COUNT(*) as total_events
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Step 3: View in Table Editor (Alternative)

1. Click **Table Editor** in left sidebar
2. Select `analytics_events` table
3. Click **Filters** to filter by event type
4. Sort by `created_at` descending to see recent events

## 🔍 Understanding the Data

### Event Types
- `ticker_view` - Someone viewed a stock page
- `ticker_search` - Someone searched for a stock
- `portfolio_create` - Someone created a portfolio
- `portfolio_view` - Someone viewed a portfolio
- `trade_add` - Someone added a trade

### Fields
- `session_hash` - Anonymized user ID (one-way hash)
- `metadata` - JSON with event details (ticker, query, etc.)
- `created_at` - When the event happened

### Privacy Note
- User IDs are hashed (cannot be reversed)
- No personally identifiable information stored
- GDPR compliant

## 📈 Creating a Dashboard (Optional)

You can create a Metabase/Grafana dashboard connected to Supabase to visualize:
- Trending tickers over time
- Search trends
- User activity patterns
- Peak usage hours

Or use Supabase's built-in charts (coming soon in their dashboard).

## 🚀 Quick Check

To verify tracking is working:
1. Visit your app
2. Search for a stock (e.g., "AAPL")
3. View the stock page
4. Run this query in Supabase:

```sql
SELECT * FROM analytics_events 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see your recent actions!
