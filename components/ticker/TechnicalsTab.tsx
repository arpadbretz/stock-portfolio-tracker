'use client';

import TechnicalIndicators from '@/components/TechnicalIndicators';
import PeerComparison from '@/components/PeerComparison';

interface TechnicalsTabProps {
    symbol: string;
    stock: any;
    chartData: any[];
}

export default function TechnicalsTab({ symbol, stock, chartData }: TechnicalsTabProps) {
    return (
        <div className="space-y-8">
            {/* Technical Indicators */}
            {chartData.length > 30 ? (
                <TechnicalIndicators
                    historicalData={chartData.map(d => ({
                        date: d.date,
                        close: d.close,
                    }))}
                    symbol={symbol}
                />
            ) : (
                <div className="bg-card border border-border rounded-[40px] p-8 text-center">
                    <p className="text-muted-foreground">Not enough data for technical analysis. Need at least 30 data points.</p>
                </div>
            )}

            {/* Peer Comparison */}
            {stock && stock.sector && (
                <PeerComparison
                    symbol={symbol}
                    sector={stock.sector}
                    industry={stock.industry || stock.sector}
                    currentPrice={stock.price}
                    currentPE={stock.trailingPE}
                    currentMarketCap={stock.marketCap}
                />
            )}
        </div>
    );
}
