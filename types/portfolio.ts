// Trade data types for the Stock Portfolio Tracker

export type CurrencyCode = 'USD' | 'EUR' | 'HUF';

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
  cashBalance: number; // Normalized total in preferred currency
  cashBalances?: Record<string, number>; // Breakdown by currency
  totalDeposits: number;
  totalWithdrawals: number;
  totalDividends: number;
  totalFees: number;
  transactions: CashTransaction[];
  flowSummary: CashFlowSummary[];
}

export type CashTransactionFormData = Omit<CashTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// Realized P/L types
export interface RealizedPnL {
  id: string;
  user_id: string;
  portfolio_id: string;
  trade_id?: string;
  ticker: string;
  quantity: number;
  cost_basis: number;
  sale_price: number;
  realized_gain: number;
  realized_gain_percent: number;
  holding_period_days?: number;
  closed_at: string;
  created_at: string;
}

export interface RealizedPnLSummary {
  total_realized_gain: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_gain: number;
  avg_loss: number;
  biggest_win: number;
  biggest_loss: number;
}

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
  cash_transaction_id?: string;  // Links to cash transaction
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
  currency?: string;
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
  currency?: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalMarketValue: number;
  totalGain: number;  // Unrealized gain
  totalGainPercent: number;
  cashBalance: number;  // Available cash in portfolio
  cashBalances?: Record<CurrencyCode, number>; // Breakdown by currency
  totalPortfolioValue: number;  // Market value + cash balance
  realizedGain?: number;  // Total realized P/L from closed positions
  totalReturn?: number;  // Unrealized + Realized gains
  holdings: Holding[];
  exchangeRates: Record<CurrencyCode, number>;
  dailyPnL?: number;
  dailyPnLPercent?: number;
  fxPnL?: number;
}

export type TradeFormData = Omit<Trade, 'id' | 'timestamp' | 'totalCost'>;
