// Trade data types for the Stock Portfolio Tracker

export type CurrencyCode = 'USD' | 'EUR' | 'HUF' | 'GBP';

// Cash transaction types
export type CashTransactionType =
  | 'DEPOSIT'      // Cash added to portfolio
  | 'WITHDRAWAL'   // Cash removed from portfolio
  | 'DIVIDEND'     // Dividend received
  | 'INTEREST'     // Interest earned
  | 'FEE'          // Fees charged
  | 'TAX'          // Tax withholding
  | 'ADJUSTMENT';  // Manual balance adjustment

export interface CashTransaction {
  id: string;
  user_id: string;
  portfolio_id: string;
  transaction_type: CashTransactionType;
  amount: number;
  currency: CurrencyCode;
  ticker?: string;  // For dividend/interest related to specific stock
  description?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface CashFlowSummary {
  transaction_type: CashTransactionType;
  total_amount: number;
  transaction_count: number;
}

export interface CashBalanceData {
  cashBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalDividends: number;
  totalFees: number;
  transactions: CashTransaction[];
  flowSummary: CashFlowSummary[];
}

export type CashTransactionFormData = Omit<CashTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

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
  beta?: number;
  dayChange?: number;
  dayChangePercent?: number;
}

export interface PriceData {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  sector?: string;
  industry?: string;
  beta?: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalMarketValue: number;
  totalGain: number;
  totalGainPercent: number;
  cashBalance: number;  // Available cash in portfolio
  totalPortfolioValue: number;  // Market value + cash balance
  holdings: Holding[];
  exchangeRates: Record<CurrencyCode, number>;
}

export type TradeFormData = Omit<Trade, 'id' | 'timestamp' | 'totalCost'>;
