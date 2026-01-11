# StockTrackr.eu - Master Implementation Roadmap

> **Last Updated:** January 11, 2026  
> **Version:** 2.0  
> **Total Features:** 85 items across 10 categories

---

## 📋 Priority Legend

| Priority | Meaning | Effort |
|----------|---------|--------|
| 🔴 **HIGH** | Critical for user experience | 1-4 hours |
| 🟡 **MEDIUM** | Important but not blocking | 2-8 hours |
| 🟢 **LOW** | Nice-to-have, future enhancement | 4-16 hours |

---

## 🔴 HIGH PRIORITY TASKS (Ship This Week)

### Authentication & Security
- [ ] **Google OAuth Login** - Most requested auth method (#AUTH-001)
- [ ] **Apple Sign-In** - Required for iOS users (#AUTH-002)
- [ ] **Change Password in Settings** - Basic security feature (#AUTH-003)
- [ ] **Linked Accounts Display** - Show connected OAuth providers (#AUTH-004)

### Dashboard Improvements
- [ ] **Daily P&L Summary** - "Today you're up $X" notification (#DASH-001)
- [ ] **Quick Actions Bar** - One-click access to common tasks (#DASH-002)
- [ ] **Widget Customization** - Drag-and-drop dashboard layout (#DASH-003)

### Stock Research Page
- [ ] **Technical Indicators** - RSI, MACD, Moving Averages overlay (#TICK-001)
- [ ] **Peer Comparison Table** - Compare to industry competitors (#TICK-002)
- [ ] **Add to Portfolio Button** - Quick trade entry from ticker page (#TICK-003)

### Account Settings
- [ ] **Profile Photo Upload** - Avatar/profile picture (#ACCT-001)
- [ ] **Display Name Setting** - Customize name shown in app (#ACCT-002)
- [ ] **Change Password** - In-app password change (#ACCT-003)
- [ ] **Linked Accounts Manager** - Show/manage OAuth connections (#ACCT-004)

### Price Alerts
- [ ] **Email Notifications** - Send email when alert triggers (#ALRT-001)
- [ ] **Edit Existing Alerts** - Modify target price without deleting (#ALRT-002)

### UX/UI Global
- [ ] **Loading Skeletons** - Replace spinners with skeleton screens (#UX-001)
- [ ] **Toast Notifications** - Success/error feedback for actions (#UX-002)
- [ ] **Keyboard Shortcuts** - Power user navigation (/, Cmd+K) (#UX-003)
- [ ] **Command Palette** - Spotlight-style search (Cmd+K) (#UX-004)

### Landing Page
- [ ] **Testimonials Section** - Social proof with user testimonials (#LAND-001)
- [ ] **Demo Video/GIF** - Show the app in action (#LAND-002)

### Mobile Experience
- [ ] **Bottom Tab Bar** - Easy thumb navigation (#MOB-001)
- [ ] **Pull to Refresh** - Native-feeling refresh gesture (#MOB-002)

---

## 🟡 MEDIUM PRIORITY TASKS (Ship This Month)

### Authentication
- [ ] **Facebook Login** - Popular social login option (#AUTH-005)
- [ ] **Microsoft/LinkedIn Login** - Professional user audience (#AUTH-006)
- [ ] **"Remember Me" Checkbox** - Persistent session option (#AUTH-007)
- [ ] **Magic Link Login** - Passwordless email login (#AUTH-008)

### Dashboard
- [ ] **Market Overview Widget** - Show major indices (S&P 500, NASDAQ) (#DASH-004)
- [ ] **News Feed Widget** - Aggregate news for your holdings (#DASH-005)
- [ ] **Dividend Calendar** - Upcoming dividend payments (#DASH-006)
- [ ] **Earnings Calendar** - Holdings with upcoming earnings (#DASH-007)
- [ ] **Performance Timeframes** - 1W, 1M, 3M, YTD, 1Y, All selectors (#DASH-008)

### Stock Research
- [ ] **Earnings History Chart** - EPS beat/miss visualization (#TICK-004)
- [ ] **Revenue/Income Charts** - Historical financials visualization (#TICK-005)
- [ ] **Dividend History** - Historical dividend payments chart (#TICK-006)
- [ ] **Options Chain Display** - Basic options data (#TICK-007)

### Account Settings
- [ ] **Email Preferences** - Notification settings (alerts, newsletters) (#ACCT-005)
- [ ] **Theme Preference** - Default dark/light/system setting (#ACCT-006)
- [ ] **Language Selection** - i18n support (EN, HU, DE) (#ACCT-007)
- [ ] **Export Format Options** - CSV, Excel, PDF options (#ACCT-008)
- [ ] **Timezone Setting** - For accurate time displays (#ACCT-009)

### Price Alerts
- [ ] **Percentage-based Alerts** - "Alert me when AAPL drops 5%" (#ALRT-003)
- [ ] **Push Notifications** - Browser push for PWA users (#ALRT-004)
- [ ] **Alert Templates** - Quick presets (52-week high, 20% drop) (#ALRT-005)

### DCF Calculator
- [ ] **Sensitivity Analysis Table** - Value at different growth/discount rates (#DCF-001)
- [ ] **Monte Carlo Simulation** - Probability distribution of outcomes (#DCF-002)
- [ ] **Scenario Comparison** - Side-by-side Bull/Base/Bear cases (#DCF-003)
- [ ] **Export to PDF** - Professional valuation report (#DCF-004)

### Watchlist
- [ ] **Watchlist Groups** - Organize into categories (Tech, Value) (#WATCH-001)
- [ ] **Custom Columns** - Choose which metrics to display (#WATCH-002)
- [ ] **Bulk Actions** - Select multiple, delete all selected (#WATCH-003)
- [ ] **Drag-and-Drop Reorder** - Manual sorting (#WATCH-004)

### Landing Page
- [ ] **Pricing Comparison Table** - Free vs Premium features (#LAND-003)
- [ ] **FAQ Section** - Common questions accordion (#LAND-004)
- [ ] **Blog/Resources Link** - Educational content hub (#LAND-005)

### UX/UI Global
- [ ] **Onboarding Tour** - First-time user walkthrough (#UX-005)
- [ ] **Empty State Designs** - Better messaging when no data (#UX-006)
- [ ] **Offline Support (PWA)** - Caching for offline viewing (#UX-007)
- [ ] **Breadcrumb Navigation** - Path indicator on sub-pages (#UX-008)

### Mobile Experience
- [ ] **Swipe Actions** - Swipe on holdings for quick actions (#MOB-003)
- [ ] **Mobile-Optimized Charts** - Touch-friendly interactions (#MOB-004)

---

## 🟢 LOW PRIORITY TASKS (Future Enhancements)

### Authentication
- [ ] **2FA/MFA Support** - Extra security layer (#AUTH-009)
- [ ] **Login History** - Show recent login devices/locations (#AUTH-010)

### Dashboard
- [ ] **Goals/Targets Widget** - "Save $10,000 by 2026" progress (#DASH-009)
- [ ] **Benchmark Comparison** - Compare portfolio vs S&P 500 (#DASH-010)

### Stock Research
- [ ] **Social Sentiment** - Twitter/Reddit mentions (#TICK-008)
- [ ] **AI Stock Summary** - AI-generated analysis (#TICK-009)
- [ ] **Similar Stocks** - "Users also viewed" recommendations (#TICK-010)

### Account Settings
- [ ] **Personal API Keys** - API access for power users (#ACCT-010)
- [ ] **Activity Log** - Recent actions history (#ACCT-011)
- [ ] **Connected Brokers** - Link brokerage accounts (#ACCT-012)

### Price Alerts
- [ ] **SMS Alerts** - Text message notifications (#ALRT-006)
- [ ] **Recurring Alerts** - Auto-reset after triggering (#ALRT-007)

### DCF Calculator
- [ ] **DDM Model** - Dividend Discount Model alternative (#DCF-005)
- [ ] **Comps Valuation** - Comparable company multiples (#DCF-006)

### Watchlist
- [ ] **Watchlist Sharing** - Share watchlist with others (#WATCH-005)

### Landing Page
- [ ] **Live Demo Mode** - Try without signing up (#LAND-006)
- [ ] **Animated Statistics** - User count, portfolios managed (#LAND-007)

### UX/UI Global
- [ ] **Confetti Animations** - Celebrate milestones (#UX-009)
- [ ] **Haptic Feedback** - Mobile vibration on actions (#UX-010)

### Mobile Experience
- [ ] **App Store Presence** - PWA installable from stores (#MOB-005)

---

## ✅ COMPLETED FEATURES

### Phase 1: Core Infrastructure
- [x] Next.js 15 + TypeScript setup
- [x] Supabase authentication (Email + GitHub)
- [x] PostgreSQL database with RLS
- [x] Dark/Light theme toggle
- [x] Responsive design foundation

### Phase 2: Portfolio Management
- [x] Add/Edit/Delete trades
- [x] Holdings aggregation with live prices
- [x] Multi-portfolio support
- [x] Portfolio switching
- [x] CSV import functionality
- [x] Currency conversion (USD, EUR, HUF, GBP)

### Phase 3: Stock Research
- [x] Stock search with real-time suggestions
- [x] Detailed ticker pages
- [x] Price charts with multiple timeframes
- [x] Key metrics display
- [x] Analyst ratings
- [x] Institutional ownership
- [x] Insider transactions
- [x] News feed
- [x] SEC filings

### Phase 4: Analytics & Reporting
- [x] Sector allocation pie chart
- [x] Performance chart
- [x] Comprehensive report page
- [x] Portfolio sharing (public links)

### Phase 5: Advanced Features
- [x] Watchlist functionality
- [x] Price alerts system
- [x] Notification bell in sidebar
- [x] DCF Calculator (Simple + Advanced)
- [x] Save/Load DCF analyses
- [x] WACC calculator
- [x] Year-by-year growth projections

### Phase 6: Compliance & Legal
- [x] GDPR compliance
- [x] Privacy policy
- [x] Terms of service
- [x] Cookie consent banner
- [x] Data export (GDPR right to portability)
- [x] Account deletion (GDPR right to erasure)

---

## 📊 Implementation Statistics

| Category | Total | High | Medium | Low | Completed |
|----------|-------|------|--------|-----|-----------|
| Authentication | 10 | 4 | 4 | 2 | 2 |
| Dashboard | 10 | 3 | 5 | 2 | 6 |
| Ticker Page | 10 | 3 | 4 | 3 | 12 |
| Account | 12 | 4 | 5 | 3 | 4 |
| Alerts | 7 | 2 | 3 | 2 | 3 |
| DCF | 6 | 0 | 4 | 2 | 5 |
| Watchlist | 5 | 0 | 4 | 1 | 1 |
| Landing | 7 | 2 | 3 | 2 | 1 |
| UX/UI | 10 | 4 | 4 | 2 | 4 |
| Mobile | 5 | 2 | 2 | 1 | 1 |
| **TOTAL** | **82** | **24** | **38** | **20** | **39** |

---

## 🚀 Quick Win Implementation Order

These can be implemented in 1-2 hours each:

1. **Google OAuth** - Configure in Supabase → Update login page
2. **Toast Notifications** - `npm install sonner` → Add provider
3. **Loading Skeletons** - Replace `animate-spin` with shimmer
4. **Profile Photo** - Supabase storage bucket
5. **Apple Sign-In** - Configure in Supabase → Update login page
6. **Edit Alerts** - Add PUT endpoint + UI
7. **Bottom Tab Bar (Mobile)** - New component
8. **Pull to Refresh** - Hook in dashboard
9. **Command Palette** - `npm install cmdk`
10. **Daily P&L Notification** - Calculate and display

---

## 🔧 Technical Notes

### OAuth Setup (Supabase)
```
Dashboard → Authentication → Providers
- Enable Google, Apple, Facebook, Microsoft
- Add redirect URLs
- Update login/register pages
```

### Required Packages to Install
```bash
npm install sonner          # Toast notifications
npm install cmdk            # Command palette
npm install @tanstack/react-virtual  # Virtualized lists
npm install framer-motion   # Already installed
npm install react-joyride   # Onboarding tours
```

### Supabase Edge Functions Needed
- Price alert email sender
- Daily portfolio summary email
- Earnings/dividend calendar sync

---

## 📅 Suggested Sprint Plan

### Sprint 1 (Week 1)
- Google + Apple OAuth
- Toast notifications
- Loading skeletons
- Profile settings (photo, name)

### Sprint 2 (Week 2)
- Command palette
- Email notifications for alerts
- Edit alerts functionality
- Daily P&L summary

### Sprint 3 (Week 3)
- Technical indicators on charts
- Peer comparison table
- Bottom tab bar (mobile)
- Pull to refresh

### Sprint 4 (Week 4)
- Market overview widget
- Earnings/dividend calendars
- Watchlist groups
- Custom columns

---

*This document is the single source of truth for the StockTrackr.eu roadmap.*
