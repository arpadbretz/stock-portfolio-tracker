// Technical Indicators Library for Stock Analysis

export interface OHLCData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface IndicatorData {
    date: string;
    value: number | null;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
    }

    return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);

    // Start with SMA for the first EMA value
    let ema: number | null = null;

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else if (i === period - 1) {
            // First EMA is the SMA
            ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
            result.push(ema);
        } else {
            ema = (data[i] - ema!) * multiplier + ema!;
            result.push(ema);
        }
    }

    return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 * RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss over period
 */
export function calculateRSI(closePrices: number[], period: number = 14): (number | null)[] {
    const result: (number | null)[] = [];

    if (closePrices.length < period + 1) {
        return closePrices.map(() => null);
    }

    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < closePrices.length; i++) {
        changes.push(closePrices[i] - closePrices[i - 1]);
    }

    // Separate gains and losses
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

    // Calculate initial averages
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // First period values are null
    for (let i = 0; i < period; i++) {
        result.push(null);
    }

    // Calculate RSI for each period
    for (let i = period; i < closePrices.length; i++) {
        if (i === period) {
            // First RSI value
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            result.push(100 - (100 / (1 + rs)));
        } else {
            // Smoothed averages
            avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;

            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            result.push(100 - (100 / (1 + rs)));
        }
    }

    return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * MACD Line = 12-period EMA - 26-period EMA
 * Signal Line = 9-period EMA of MACD Line
 * Histogram = MACD Line - Signal Line
 */
export function calculateMACD(
    closePrices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
): {
    macd: (number | null)[];
    signal: (number | null)[];
    histogram: (number | null)[];
} {
    const fastEMA = calculateEMA(closePrices, fastPeriod);
    const slowEMA = calculateEMA(closePrices, slowPeriod);

    // MACD Line
    const macdLine: (number | null)[] = [];
    for (let i = 0; i < closePrices.length; i++) {
        if (fastEMA[i] === null || slowEMA[i] === null) {
            macdLine.push(null);
        } else {
            macdLine.push(fastEMA[i]! - slowEMA[i]!);
        }
    }

    // Filter out nulls for signal calculation
    const macdValues = macdLine.filter(v => v !== null) as number[];
    const signalEMA = calculateEMA(macdValues, signalPeriod);

    // Map signal back to full length
    const signal: (number | null)[] = [];
    const histogram: (number | null)[] = [];
    let signalIndex = 0;

    for (let i = 0; i < closePrices.length; i++) {
        if (macdLine[i] === null) {
            signal.push(null);
            histogram.push(null);
        } else {
            if (signalIndex < signalEMA.length && signalEMA[signalIndex] !== null) {
                signal.push(signalEMA[signalIndex]);
                histogram.push(macdLine[i]! - signalEMA[signalIndex]!);
            } else {
                signal.push(null);
                histogram.push(null);
            }
            signalIndex++;
        }
    }

    return { macd: macdLine, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 * Middle Band = 20-period SMA
 * Upper Band = Middle Band + (2 × 20-period standard deviation)
 * Lower Band = Middle Band - (2 × 20-period standard deviation)
 */
export function calculateBollingerBands(
    closePrices: number[],
    period: number = 20,
    stdDevMultiplier: number = 2
): {
    upper: (number | null)[];
    middle: (number | null)[];
    lower: (number | null)[];
} {
    const middle = calculateSMA(closePrices, period);
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];

    for (let i = 0; i < closePrices.length; i++) {
        if (i < period - 1 || middle[i] === null) {
            upper.push(null);
            lower.push(null);
        } else {
            // Calculate standard deviation
            const slice = closePrices.slice(i - period + 1, i + 1);
            const mean = middle[i]!;
            const squaredDiffs = slice.map(v => Math.pow(v - mean, 2));
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
            const stdDev = Math.sqrt(variance);

            upper.push(mean + stdDevMultiplier * stdDev);
            lower.push(mean - stdDevMultiplier * stdDev);
        }
    }

    return { upper, middle, lower };
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(ohlcData: OHLCData[], period: number = 14): (number | null)[] {
    if (ohlcData.length < 2) return ohlcData.map(() => null);

    const trueRanges: number[] = [];

    for (let i = 0; i < ohlcData.length; i++) {
        if (i === 0) {
            trueRanges.push(ohlcData[i].high - ohlcData[i].low);
        } else {
            const highLow = ohlcData[i].high - ohlcData[i].low;
            const highClose = Math.abs(ohlcData[i].high - ohlcData[i - 1].close);
            const lowClose = Math.abs(ohlcData[i].low - ohlcData[i - 1].close);
            trueRanges.push(Math.max(highLow, highClose, lowClose));
        }
    }

    return calculateSMA(trueRanges, period);
}

/**
 * Get indicator interpretation
 */
export function interpretRSI(value: number): { signal: 'overbought' | 'oversold' | 'neutral'; description: string } {
    if (value >= 70) {
        return { signal: 'overbought', description: 'Overbought - Potential sell signal' };
    } else if (value <= 30) {
        return { signal: 'oversold', description: 'Oversold - Potential buy signal' };
    }
    return { signal: 'neutral', description: 'Neutral - No strong signal' };
}

export function interpretMACD(macd: number, signal: number): { signal: 'bullish' | 'bearish' | 'neutral'; description: string } {
    if (macd > signal && macd > 0) {
        return { signal: 'bullish', description: 'Bullish - MACD above signal line' };
    } else if (macd < signal && macd < 0) {
        return { signal: 'bearish', description: 'Bearish - MACD below signal line' };
    }
    return { signal: 'neutral', description: 'Neutral - No clear trend' };
}
