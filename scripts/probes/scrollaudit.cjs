// node scrollaudit.cjs <pageUrl> <outDir> <label> [points]
// Walks the page to chapter fractions like a visitor (stepped scroll, scrub
// settles) and shoots desktop 1440x900 and phone 390x844, then builds one
// contact sheet per viewport, to check that the 3D subject matches the copy at
// every reading point and that no hand-off is an empty screen. `points`:
// chapter ids ("hero,core") or explicit "id:fraction" pairs ("core:1,inside:0.3").
// Exits non-zero on console errors.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const path = require('path');
const [pageUrl, outArg, label, only] = process.argv.slice(2);
const out = path.resolve(outArg);
fs.mkdirSync(out, { recursive: true });
const ALL = [
  ['hero', 0], ['core', 0.5], ['core', 1], ['inside', 0.3], ['inside', 1], ['software', 0.5], ['appcare', 0.1],
  ['appcare', 0.6], ['portal', 0.5], ['games', 0.12], ['games', 0.5], ['studio', 0.5], ['contact', 0.7],
];
const points = !only ? ALL : only.includes(':') ? only.split(',').map((p) => [p.split(':')[0], Number(p.split(':')[1])]) : ALL.filter(([id]) => only.split(',').includes(id));
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] });
  const errors = [];
  for (const [vp, size] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1, isMobile: vp === 'phone', hasTouch: vp === 'phone' });
    page.on('console', (m) => m.type() === 'error' && errors.push(`${vp}: ${m.text().slice(0, 160)}`));
    page.on('pageerror', (e) => errors.push(`${vp}: ${e.message}`));
    await page.goto(pageUrl);
    await page.locator('.page-overlay.is-lifted').waitFor({ state: 'attached', timeout: 60000 });
    await page.waitForTimeout(4000); // the awakening tween is time-based (3.4 s)
    const files = [];
    for (const [id, f] of points) {
      // Walk there in steps like a visitor (scrub follows), then let the scrub settle.
      const top = await page.evaluate(([id, f]) => {
        const el = document.getElementById(id);
        return el.offsetTop + Math.max(0, el.offsetHeight - innerHeight) * f;
      }, [id, f]);
      let y = await page.evaluate(() => scrollY);
      while (Math.abs(top - y) > 400) { y += Math.sign(top - y) * 400; await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(30); }
      await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top);
      await page.waitForTimeout(1600); // scrub 0.9 s + camera damping; no scene-settled signal is exposed
      const file = `${out}/${label}-${vp}-${id}-${String(Math.round(f * 100)).padStart(3, '0')}.png`;
      await page.screenshot({ path: file });
      files.push([file, `${id} ${Math.round(f * 100)}%`]);
    }
    await page.close();
    // Contact sheet: an HTML grid of the shots, screenshotted.
    const w = vp === 'desktop' ? 360 : 180;
    const html = `<body style="margin:0;background:#222;font:12px system-ui;color:#eee;display:flex;flex-wrap:wrap;gap:6px;padding:6px;width:${vp === 'desktop' ? 1494 : 1356}px">${files
      .map(([f, t]) => `<figure style="margin:0"><img src="file://${f}" style="width:${w}px;display:block"><figcaption>${t}</figcaption></figure>`)
      .join('')}</body>`;
    fs.writeFileSync(`${out}/${label}-${vp}.html`, html);
    const sheet = await browser.newPage({ viewport: { width: vp === 'desktop' ? 1506 : 1368, height: 400 } });
    await sheet.goto(`file://${out}/${label}-${vp}.html`);
    await sheet.screenshot({ path: `${out}/${label}-${vp}-sheet.png`, fullPage: true });
    await sheet.close();
    console.log('SHEET', `${label}-${vp}-sheet.png`, files.length, 'shots');
  }
  await browser.close();
  console.log('CONSOLE_ERRORS', errors.length, JSON.stringify(errors.slice(0, 5)));
  if (errors.length) process.exitCode = 1;
})().catch((e) => { console.log('FAIL', e.message); process.exit(1); });
