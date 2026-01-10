import { createHash } from 'crypto';

// GDPR-compliant analytics tracking
// Only tracks if user has given consent via cookie banner

export type AnalyticsEvent =
    | 'ticker_view'
    | 'ticker_search'
    | 'portfolio_create'
    | 'portfolio_view'
    | 'trade_add'
    | 'report_generate'
    | 'stock_research_visit';

interface EventMetadata {
    ticker?: string;
    portfolioId?: string;
    [key: string]: any;
}

// One-way hash for anonymization
function hashUserId(userId: string): string {
    const salt = process.env.NEXT_PUBLIC_ANALYTICS_SALT || 'default-salt-change-me';
    return createHash('sha256').update(userId + salt).digest('hex');
}

// Check if user has consented to analytics
function hasConsent(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const consent = localStorage.getItem('cookie_consent');
        return consent === 'accepted';
    } catch {
        return false;
    }
}

// Track event (GDPR compliant)
export async function trackEvent(
    eventType: AnalyticsEvent,
    userId: string | null,
    metadata?: EventMetadata
): Promise<void> {
    // Only track if user has consented
    if (!hasConsent()) {
        console.log('[Analytics] Skipped - no consent');
        return;
    }

    try {
        // Anonymize user ID
        const sessionHash = userId ? hashUserId(userId) : 'anonymous';

        // Remove any PII from metadata
        const sanitizedMetadata = metadata ? {
            ...metadata,
            // Remove any potential PII fields
            email: undefined,
            name: undefined,
            ip: undefined,
        } : {};

        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType,
                sessionHash,
                metadata: sanitizedMetadata,
                timestamp: Date.now(),
            }),
        });

        console.log('[Analytics] Tracked:', eventType, sanitizedMetadata);
    } catch (error) {
        console.error('[Analytics] Error:', error);
    }
}

// Track ticker view
export function trackTickerView(ticker: string, userId: string | null) {
    return trackEvent('ticker_view', userId, { ticker });
}

// Track ticker search
export function trackTickerSearch(query: string, userId: string | null) {
    return trackEvent('ticker_search', userId, { query });
}

// Track portfolio creation
export function trackPortfolioCreate(portfolioId: string, userId: string | null) {
    return trackEvent('portfolio_create', userId, { portfolioId });
}

// Track portfolio view
export function trackPortfolioView(portfolioId: string, userId: string | null) {
    return trackEvent('portfolio_view', userId, { portfolioId });
}

// Track trade addition
export function trackTradeAdd(ticker: string, action: 'BUY' | 'SELL', userId: string | null) {
    return trackEvent('trade_add', userId, { ticker, action });
}

// Track report generation
export function trackReportGenerate(userId: string | null) {
    return trackEvent('report_generate', userId);
}

// Track stock research page visit
export function trackStockResearchVisit(userId: string | null) {
    return trackEvent('stock_research_visit', userId);
}
