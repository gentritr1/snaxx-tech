// Frame pacing during intro idle + continuous wheel scroll. No readPixels (would distort timing).
// usage: node perfprobe.cjs <url>
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const [url] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('.experience-canvas canvas', { timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.evaluate(() => { window.__t = []; const f = (t) => { window.__t.push(t); requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const t0 = Date.now();
  await page.mouse.move(720, 450);
  for (let k = 0; k < 140; k++) { await page.mouse.wheel(0, 160); await page.waitForTimeout(40); }
  const wall = (Date.now() - t0) / 1000;
  const r = await page.evaluate(() => {
    const t = window.__t, d = [];
    for (let i = 1; i < t.length; i++) d.push(t[i] - t[i - 1]);
    d.sort((a, b) => a - b);
    const q = (p) => d[Math.min(d.length - 1, Math.floor(p * d.length))].toFixed(1);
    const c = document.querySelector('.experience-canvas canvas');
    return { n: d.length, span: ((t[t.length - 1] - t[0]) / 1000).toFixed(2), p50: q(0.5), p95: q(0.95), p99: q(0.99), max: d[d.length - 1].toFixed(1), over33: d.filter(x => x > 33.4).length, buf: c.width + 'x' + c.height };
  });
  console.log(JSON.stringify({ wall: wall.toFixed(2), expectedAt60: Math.round(r.span * 60), ...r }));
  await browser.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
