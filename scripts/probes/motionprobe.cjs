// Records near-black pixel counts on EVERY frame: intro + continuous wheel scroll down and back up.
// usage: node motionprobe.cjs <url> <outdir> [dpr]
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const [url, outdir, dprArg] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(outdir, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(dprArg || 2) });
  page.on('pageerror', e => console.log('pageerror', e.message));
  await page.addInitScript(() => {
    // Frame sampler: installs on first canvas, reads after each r3f frame.
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      if (type === 'webgl2' || type === 'webgl') attrs = Object.assign({}, attrs, { preserveDrawingBuffer: true });
      return orig.call(this, type, attrs);
    };
    window.__black = [];
    const tick = () => {
      const c = document.querySelector('.experience-canvas canvas');
      if (c) {
        const gl = c.getContext('webgl2');
        const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
        if (!window.__buf || window.__buf.length !== W * H * 4) window.__buf = new Uint8Array(W * H * 4);
        const buf = window.__buf;
        gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        let n = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
        for (let p = 0, i = 0; p < buf.length; p += 32, i += 8) if (buf[p] < 8 && buf[p + 1] < 8 && buf[p + 2] < 8) {
          n++; const x = i % W, y = (i / W) | 0;
          if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
        if (n * 8 > 20000 && n * 8 < W * H * 0.5 && (window.__shots = window.__shots || []).length < 4) window.__shots.push(c.toDataURL('image/png'));
        window.__black.push([Math.round(performance.now()), Math.round(scrollY), n * 8, n ? [minX, H - maxY, maxX, H - minY] : null]);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('.experience-canvas canvas', { timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.mouse.move(720, 450);
  for (let pass = 0; pass < 2; pass++) {
    const dir = pass === 0 ? 1 : -1;
    for (let k = 0; k < 140; k++) {
      await page.mouse.wheel(0, dir * 160);
      await page.waitForTimeout(40);
      if (k % 20 === 0) await page.mouse.move(300 + (k * 37) % 900, 200 + (k * 53) % 500);
    }
    await page.waitForTimeout(1500);
  }
  const rows = await page.evaluate(() => window.__black);
  const bad = rows.filter(r => r[2] > 400);
  console.log('frames', rows.length, 'framesWithBlack>400px', bad.length, 'max', Math.max(...rows.map(r => r[2])));
  console.log(JSON.stringify(bad.slice(0, 25)));
  const shots = await page.evaluate(() => window.__shots || []);
  shots.forEach((d, i) => fs.writeFileSync(`${outdir}/shot-${i}.png`, Buffer.from(d.split(',')[1], 'base64')));
  fs.writeFileSync(`${outdir}/frames.json`, JSON.stringify(rows));
  await browser.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
