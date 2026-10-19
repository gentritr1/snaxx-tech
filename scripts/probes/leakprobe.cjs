// WebGL contexts and canvases still alive after client-side Home -> /legal -> Home trips.
// Counts with CDP Runtime.queryObjects after a forced GC. Exits 1 if either count grows.
// usage: node leakprobe.cjs <baseUrl> [visits=4]
//
// Measurement traps this script avoids (each one fakes or hides the leak):
// - page.goto() reloads the document, so nothing can leak; navigate by clicking links.
// - A WeakRef count of contexts that are not isContextLost() is always 1: R3F loses the
//   old context on unmount, but a lost context can still be retained.
// - Every queryObjects result and every ElementHandle (page.waitForSelector) is held by
//   the inspector ("DevTools console" in a heap snapshot) until released, which pins each
//   canvas seen and makes the counts grow by the full canvas count per visit.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const [base, visitsArg] = process.argv.slice(2);
const visits = Number(visitsArg || 4);

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const cdp = await page.context().newCDPSession(page);

  const count = async (proto) => {
    const { result } = await cdp.send('Runtime.evaluate', { expression: `${proto}.prototype` });
    const { objects } = await cdp.send('Runtime.queryObjects', { prototypeObjectId: result.objectId });
    const { result: n } = await cdp.send('Runtime.callFunctionOn', { objectId: objects.objectId, functionDeclaration: 'function(){return this.length}', returnByValue: true });
    await cdp.send('Runtime.releaseObject', { objectId: objects.objectId });
    await cdp.send('Runtime.releaseObject', { objectId: result.objectId });
    return n.value;
  };
  const measure = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { usedSize } = await cdp.send('Runtime.getHeapUsage');
    return { webgl2: await count('WebGL2RenderingContext'), canvases: await count('HTMLCanvasElement'), heapMB: +(usedSize / 1e6).toFixed(1) };
  };
  const settleHome = async () => {
    await page.locator('.experience-canvas canvas').waitFor({ timeout: 30000 }); // a locator keeps no handle
    await page.waitForTimeout(4000); // precompile + curtain
  };

  await page.goto(base + '/', { waitUntil: 'load' });
  await settleHome();
  const rows = [await measure()];
  for (let i = 2; i <= visits; i++) {
    await page.click('footer a[href="/legal"]');
    await page.waitForURL('**/legal');
    await page.waitForTimeout(1500);
    await page.click('header a[href="/"]');
    await settleHome();
    rows.push(await measure());
  }
  rows.forEach((r, i) => console.log(JSON.stringify({ visit: i + 1, ...r })));
  console.log(JSON.stringify({ consoleErrors: errors }));
  await browser.close();
  const [first, last] = [rows[0], rows[rows.length - 1]];
  if (last.webgl2 > first.webgl2 || last.canvases > first.canvases) process.exit(1);
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
