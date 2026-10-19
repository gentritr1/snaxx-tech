// Does the hero look the same on a return visit as on a first visit?
// Per motion setting: fresh visit A, fresh visit B (the null control), then B scrolls to 86%,
// clicks the footer link to /legal and "Back to home" (client-side, no reload), and is shot
// again at scroll 0. Reports the share of pixels whose luma differs by more than 25.
// usage: node revisitprobe.cjs <baseUrl> <outdir>
// Exits 1 if revisit-vs-B exceeds the null (A-vs-B) by more than 4 points, or on console errors.
// Why 4 (2026-10-19, 1440x900, 3 runs per arm): with motion on the core spins on clock time, so
// a single frame carries phase noise (null 0.36-1.68). Stale state measured +6.4..+6.9 points
// (reduced motion +17.1); after the reset fix -0.6..+2.1 (reduced motion 0).
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const path = require('path');
const [base, outdir] = process.argv.slice(2);
fs.mkdirSync(outdir, { recursive: true });

// Decodes both PNGs in a blank page (no image library needed) and counts luma changes > 25.
const diff = (page, a, b) =>
  page.evaluate(
    async ([a, b]) => {
      const px = async (b64) => {
        const img = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
        const c = new OffscreenCanvas(img.width, img.height).getContext('2d');
        c.drawImage(img, 0, 0);
        return c.getImageData(0, 0, img.width, img.height).data;
      };
      const [x, y] = await Promise.all([px(a), px(b)]);
      const l = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      let n = 0;
      for (let i = 0; i < x.length; i += 4) if (Math.abs(l(x, i) - l(y, i)) > 25) n++;
      return +((400 * n) / x.length).toFixed(2);
    },
    [fs.readFileSync(a, 'base64'), fs.readFileSync(b, 'base64')],
  );

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const errors = [];
  let failed = false;
  for (const motion of ['no-preference', 'reduce']) {
    const shots = {};
    const pages = [];
    const settle = async (page) => {
      await page.locator('.experience-canvas canvas').waitFor({ timeout: 30000 });
      const y = await page.evaluate(() => window.scrollY);
      if (y !== 0) console.log(`scrollY on arrival ${y}, scrolling to 0`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(8000); // curtain + 3.4 s awakening + camera damping
    };
    for (const name of ['A', 'B']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: motion });
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`${motion}/${name}: ${m.text()}`);
        if (m.text().startsWith('[sceneState]')) console.log(`${motion}/${name} ${m.text()}`);
      });
      page.on('pageerror', (e) => errors.push(`${motion}/${name}: ${e.message}`));
      await page.goto(base + '/', { waitUntil: 'load' });
      await settle(page);
      shots[name + '1'] = path.join(outdir, `${motion}-${name}1.png`);
      await page.screenshot({ path: shots[name + '1'] });
      pages.push(page);
    }
    const page = pages[1];
    await page.evaluate(() => window.scrollTo(0, 0.86 * (document.documentElement.scrollHeight - innerHeight)));
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outdir, `${motion}-B-86pct.png`) });
    await page.click('footer a[href="/legal"]');
    await page.waitForURL('**/legal');
    await page.waitForTimeout(1500);
    await page.click('a[aria-label="Back to home"]');
    await page.waitForURL((u) => u.pathname === '/');
    await settle(page);
    shots.B2 = path.join(outdir, `${motion}-B2.png`);
    await page.screenshot({ path: shots.B2 });
    const blank = await browser.newPage();
    const row = { motion, nullA1vsB1: await diff(blank, shots.A1, shots.B1), revisitB1vsB2: await diff(blank, shots.B1, shots.B2), A1vsB2: await diff(blank, shots.A1, shots.B2) };
    await blank.close();
    console.log(JSON.stringify(row));
    if (row.revisitB1vsB2 - row.nullA1vsB1 > 4) failed = true;
    await Promise.all(pages.map((p) => p.close()));
  }
  console.log(JSON.stringify({ consoleErrors: errors }));
  await browser.close();
  if (failed || errors.length) process.exit(1);
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
