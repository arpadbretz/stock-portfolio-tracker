const YahooFinance = require('yahoo-finance2').default;

async function test() {
    try {
        console.log('Default export type:', typeof YahooFinance);

        // Instantiate directly
        const yf = new YahooFinance();
        console.log('Successfully created yf instance');

        // Check if quote exists on the instance (it should be on the prototype)
        console.log('Has quote method?', typeof yf.quote === 'function');

        const quote = await yf.quote('AAPL');
        console.log('AAPL Price:', quote.regularMarketPrice);
    } catch (err) {
        console.error('Error in test script:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

test();
