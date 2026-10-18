// Requests per visit (first + repeat in the same browser cache), bytes, cache headers.
// usage: node netprobe.cjs <url>
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
(async () => {
  const url = process.argv[2];
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  for (const visit of ['first', 'repeat']) {
    const reqs = new Map();
    const onResp = (e) => { const h = e.response.headers; const r = reqs.get(e.requestId) || {}; Object.assign(r, { url: e.response.url, status: e.response.status, cc: h['cache-control'] || h['Cache-Control'] || '', xc: h['x-vercel-cache'] || '', fromCache: e.response.fromDiskCache || e.response.fromMemoryCache, type: e.type }); reqs.set(e.requestId, r); };
    const onDone = (e) => { const r = reqs.get(e.requestId) || {}; r.bytes = e.encodedDataLength; reqs.set(e.requestId, r); };
    const onCache = (e) => { const r = reqs.get(e.requestId) || {}; r.fromCache = true; reqs.set(e.requestId, r); };
    cdp.on('Network.responseReceived', onResp); cdp.on('Network.loadingFinished', onDone); cdp.on('Network.requestServedFromCache', onCache);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.mouse.move(700, 400);
    for (let k = 0; k < 110; k++) { await page.mouse.wheel(0, 200); await page.waitForTimeout(25); }
    await page.waitForTimeout(2500);
    cdp.off('Network.responseReceived', onResp); cdp.off('Network.loadingFinished', onDone); cdp.off('Network.requestServedFromCache', onCache);
    const rows = [...reqs.values()].filter(r => r.url && !r.url.startsWith('data:'));
    const net = rows.filter(r => !r.fromCache);
    const kb = (n) => (n / 1024).toFixed(0) + 'KB';
    console.log(`\n${visit}: ${rows.length} requests, ${net.length} hit the network, ${kb(net.reduce((a, r) => a + (r.bytes || 0), 0))} transferred`);
    for (const r of rows) console.log(`  ${r.fromCache ? 'cache' : r.status} ${kb(r.bytes || 0).padStart(7)} ${(r.xc || '-').padEnd(6)} ${r.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 60).padEnd(60)} ${r.cc}`);
  }
  await browser.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
