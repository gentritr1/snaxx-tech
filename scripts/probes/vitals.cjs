// A/B: FCP, LCP, CLS, long-task time, React commits during scroll, requests + bytes.
// usage: node vitals.cjs <profile: desktop|mobile> <label=url>...   (runs ABAB, 3 reps)
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const [profile, ...targets] = process.argv.slice(2);
const mobile = profile === 'mobile';
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const res = {};
  for (let rep = 0; rep < 3; rep++) for (const t of targets) {
    const [label, url] = t.split('=');
    const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(() => {
      window.__m = { lcp: 0, cls: 0, longMs: 0, commits: 0, scrollCommits: 0, scrolling: false };
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { isDisabled: false, supportsFiber: true, renderers: new Map(), inject() { return 1; }, onCommitFiberRoot() { window.__m.commits++; if (window.__m.scrolling) window.__m.scrollCommits++; }, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {}, checkDCE() {} };
      new PerformanceObserver(l => l.getEntries().forEach(e => window.__m.lcp = e.startTime)).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__m.cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => l.getEntries().forEach(e => window.__m.longMs += Math.max(0, e.duration - 50))).observe({ type: 'longtask', buffered: true });
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    if (mobile) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    }
    let reqs = 0, bytes = 0;
    page.on('requestfinished', async (r) => { reqs++; try { const s = await r.sizes(); bytes += s.responseBodySize + s.responseHeadersSize; } catch {} });
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(6000);
    const fcp = await page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0);
    await page.evaluate(() => (window.__m.scrolling = true));
    for (let k = 0; k < 60; k++) { await page.mouse.wheel(0, 260); await page.waitForTimeout(50); }
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => ({ ...window.__m, dpr: document.querySelector('.experience-canvas canvas')?.width }));
    (res[label] ||= []).push({ fcp: Math.round(fcp), lcp: Math.round(m.lcp), cls: +m.cls.toFixed(3), longMs: Math.round(m.longMs), commits: m.commits, scrollCommits: m.scrollCommits, reqs, kb: Math.round(bytes / 1024) });
    await ctx.close();
  }
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[1]; };
  for (const [label, runs] of Object.entries(res)) {
    const keys = Object.keys(runs[0]);
    console.log(`${profile} ${label.padEnd(7)} ` + keys.map(k => `${k}=${med(runs.map(r => r[k]))} [${runs.map(r => r[k]).join(',')}]`).join('  '));
  }
  await b.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
