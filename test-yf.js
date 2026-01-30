const yf = require('yahoo-finance2').default;
async function test() {
  try {
    const result = await yf.quoteSummary('AAPL', { modules: ['price', 'defaultKeyStatistics'] });
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
