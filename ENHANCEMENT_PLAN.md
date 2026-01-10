# Stock Research Enhancement Plan

## Features to Implement

### 1. Insider Trading Activity
**API**: `/api/stock/[symbol]/insiders`
- Fetch from Yahoo Finance `insiderTransactions` module
- Show recent buys/sells by executives
- Display: Name, Title, Transaction Type, Shares, Value, Date

### 2. Institutional Ownership  
**API**: `/api/stock/[symbol]/institutions`
- Fetch from Yahoo Finance `institutionOwnership` module
- Show top 10 institutional holders
- Display: Institution Name, Shares Held, % of Shares, Value, Date

### 3. Short Interest
**API**: Already in `defaultKeyStatistics`
- shortRatio
- shortPercentOfFloat
- sharesShort
- sharesShortPriorMonth

### 4. News Feed
**API**: `/api/stock/[symbol]/news`
- Fetch from Yahoo Finance `news` or use external API
- Display: Headline, Source, Date, Link
- Limit to 10 most recent

### 5. SEC Filings
**API**: SEC EDGAR API (free, public)
- Endpoint: `https://data.sec.gov/submissions/CIK{cik}.json`
- Show recent 10-K, 10-Q, 8-K filings
- Link directly to SEC website

### 6. Peer Comparison
**API**: `/api/stock/[symbol]/peers`
- Yahoo Finance doesn't provide this directly
- Alternative: Use sector + industry to find similar stocks
- Compare: P/E, Market Cap, Revenue Growth, Profit Margin

### 7. Technical Indicators
**API**: Calculate from price history
- RSI (14-day)
- SMA (50-day, 200-day)
- MACD
- Bollinger Bands

### 8. Earnings History Chart
**API**: Already have in `earningsHistory`
- Chart showing EPS actual vs estimate
- Color code beats (green) vs misses (red)
- Show surprise %

## Implementation Priority

1. Fix mobile layout (TradeHistory) - DONE
2. Debug financial statements API
3. Add Insider Trading
4. Add Institutional Ownership
5. Add Short Interest
6. Add News Feed
7. Add SEC Filings
8. Add Peer Comparison
9. Add Technical Indicators
10. Add Earnings History Chart
