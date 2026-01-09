// Trade data types for the Stock Portfolio Tracker

export type CurrencyCode = 'USD' | 'EUR' | 'HUF';

export interface Trade {
  id: string;
  timestamp: string;
  ticker: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  pricePerShare: number;
  fees: number;
  totalCost: number;
  notes?: string;
  user_id?: string;
  portfolio_id?: string;
}

export interface Holding {
  ticker: string;
  shares: number;
  avgCostBasis: number;
  totalInvested: number;
  currentPrice: number;
  marketValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  allocation: number;
  sector?: string;
  industry?: string;
}

export interface PriceData {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  sector?: string;
  industry?: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalMarketValue: number;
  totalGain: number;
  totalGainPercent: number;
  holdings: Holding[];
  exchangeRates: Record<CurrencyCode, number>;
}

export type TradeFormData = Omit<Trade, 'id' | 'timestamp' | 'totalCost'>;
