import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three';

// Procedural UI textures for the holographic product panels. Drawn on a
// 2D canvas with the site's own fonts, so no external asset or request is
// needed and the interfaces always match the real brand type.

const FONT = '"Geist", Arial, sans-serif';
const MONO = '"GeistMono", "Courier New", monospace';
const SILVER = '#E6E8EE';
const MIST = '#9AA1AE';
const STEEL = 'rgba(255,255,255,0.10)';

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function panel(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  roundRect(ctx, 1, 1, w - 2, h - 2, 22);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(22,25,32,0.92)');
  g.addColorStop(1, 'rgba(10,11,15,0.90)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = MIST, size = 15) {
  ctx.font = `500 ${size}px ${MONO}`;
  ctx.fillStyle = color;
  ctx.letterSpacing = '0.14em';
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.letterSpacing = '0px';
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = SILVER, weight = 500) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.letterSpacing = size > 30 ? '-0.03em' : '0px';
  ctx.fillText(value, x, y);
  ctx.letterSpacing = '0px';
}

function pill(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, accent: string, filled = false) {
  ctx.font = `500 13px ${MONO}`;
  const w = ctx.measureText(value.toUpperCase()).width + 28 + value.length * 1.6;
  roundRect(ctx, x, y, w, 30, 15);
  ctx.fillStyle = filled ? accent : 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.strokeStyle = filled ? accent : STEEL;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  label(ctx, value, x + 14, y + 20, filled ? '#0E0F12' : MIST, 13);
  return w;
}

function avatar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hue: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue} 30% 38%)`;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function makeTexture(w: number, h: number, draw: Draw): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  // Redraw once the web fonts are in, so the panels never keep fallback glyphs.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(() => {
      draw(ctx, w, h);
      texture.needsUpdate = true;
    });
  }
  return texture;
}

/** Offday — main dashboard: balance, month calendar, who is out. */
export function createDashboardTexture(accent: string) {
  return makeTexture(1024, 640, (ctx, w, h) => {
    panel(ctx, w, h);

    // Header
    ctx.beginPath();
    ctx.arc(46, 44, 7, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    text(ctx, 'Offday', 64, 52, 24);
    label(ctx, 'Calendar', 300, 50, SILVER);
    label(ctx, 'Requests', 420, 50);
    label(ctx, 'Team', 540, 50);
    label(ctx, 'Policies', 630, 50);
    avatar(ctx, w - 50, 44, 16, 160);
    ctx.strokeStyle = STEEL;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(24, 78);
    ctx.lineTo(w - 24, 78);
    ctx.stroke();

    // Balance column
    label(ctx, 'Your balance', 44, 124);
    text(ctx, '14.5', 44, 196, 64);
    text(ctx, 'days left', 170, 196, 18, MIST, 400);
    // Ring
    const cx = 128, cy = 300, r = 58;
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.68);
    ctx.stroke();
    ctx.lineCap = 'butt';
    text(ctx, '68%', cx - 24, cy + 8, 22);
    const rows: [string, string][] = [['Accrued', '18.0'], ['Used', '3.5'], ['Pending', '1.0']];
    rows.forEach(([k, v], i) => {
      const y = 404 + i * 40;
      text(ctx, k, 44, y, 16, MIST, 400);
      text(ctx, v, 200, y, 16);
      ctx.strokeStyle = STEEL;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(44, y + 14);
      ctx.lineTo(240, y + 14);
      ctx.stroke();
    });

    // Calendar
    const cxs = 300, cys = 110;
    text(ctx, 'October 2026', cxs, cys + 18, 20);
    label(ctx, '‹   ›', cxs + 360, cys + 16, MIST, 16);
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    days.forEach((d, i) => label(ctx, d, cxs + i * 62 + 18, cys + 56, MIST, 12));
    let day = 1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < 3) continue;
        if (day > 31) break;
        const x = cxs + col * 62, y = cys + 72 + row * 54;
        const weekend = col >= 5;
        const approved = day >= 6 && day <= 8;
        const pending = day === 20 || day === 21;
        if (approved) {
          roundRect(ctx, x, y, 54, 44, 8);
          ctx.fillStyle = accent;
          ctx.fill();
        } else if (pending) {
          roundRect(ctx, x + 1, y + 1, 52, 42, 8);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        text(ctx, String(day), x + 14, y + 28, 16, approved ? '#0E0F12' : weekend ? 'rgba(154,161,174,0.5)' : SILVER, approved ? 500 : 400);
        day++;
      }
    }

    // Right column — out this week
    const rx = 760;
    label(ctx, 'Out this week', rx, 124);
    const people: [string, string, number][] = [['Arta K.', 'Mon – Wed', 160], ['Dion M.', 'Thu', 30], ['Lea B.', 'Fri', 210], ['Noah F.', 'All week', 280]];
    people.forEach(([n, d, hue], i) => {
      const y = 160 + i * 64;
      avatar(ctx, rx + 18, y + 10, 16, hue);
      text(ctx, n, rx + 46, y + 6, 16);
      text(ctx, d, rx + 46, y + 28, 13, MIST, 400);
    });
    roundRect(ctx, rx, 440, 220, 1, 0);
    ctx.fillStyle = STEEL;
    ctx.fill();
    label(ctx, 'Policy', rx, 486);
    text(ctx, '25 days · carry-over 5', rx, 516, 15, SILVER, 400);
    text(ctx, 'Resets 1 Jan', rx, 540, 13, MIST, 400);

    // Footer status
    label(ctx, 'Synced · just now', 44, h - 32, MIST, 12);
    pill(ctx, 'Request time off', w - 230, h - 56, accent, true);
  });
}

/** Offday — team calendar strip: five people, two weeks of bars. */
export function createCalendarTexture(accent: string) {
  return makeTexture(768, 512, (ctx, w, h) => {
    panel(ctx, w, h);
    text(ctx, 'Team calendar', 36, 50, 22);
    label(ctx, 'Oct 5 – Oct 18', 36, 80);
    const left = 190, top = 120, colW = (w - left - 36) / 14;
    for (let c = 0; c < 14; c++) {
      const x = left + c * colW;
      const weekend = c % 7 >= 5;
      if (weekend) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(x, top - 10, colW, h - top - 40);
      }
      label(ctx, String(5 + c), x + colW / 2 - 8, top, MIST, 11);
    }
    const people: [string, number, [number, number][]][] = [
      ['Arta K.', 160, [[1, 3]]],
      ['Dion M.', 30, [[4, 1], [10, 2]]],
      ['Lea B.', 210, [[5, 1]]],
      ['Noah F.', 280, [[0, 5], [7, 2]]],
      ['Sara P.', 330, [[9, 3]]],
    ];
    people.forEach(([n, hue, bars], i) => {
      const y = top + 46 + i * 62;
      avatar(ctx, 52, y, 14, hue);
      text(ctx, n, 76, y + 6, 15);
      ctx.strokeStyle = STEEL;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, y + 28);
      ctx.lineTo(w - 36, y + 28);
      ctx.stroke();
      bars.forEach(([start, len], b) => {
        roundRect(ctx, left + start * colW + 3, y - 12, len * colW - 6, 24, 6);
        ctx.fillStyle = b === 0 && i < 3 ? accent : 'rgba(255,255,255,0.16)';
        ctx.fill();
      });
    });
  });
}

/** Offday — approvals inbox. */
export function createApprovalsTexture(accent: string) {
  return makeTexture(768, 512, (ctx, w, h) => {
    panel(ctx, w, h);
    text(ctx, 'Approvals', 36, 50, 22);
    pill(ctx, '3 pending', w - 170, 26, accent);
    const items: [string, string, string, number][] = [
      ['Arta K.', 'Oct 6 – 8', 'Vacation', 160],
      ['Dion M.', 'Oct 9', 'Sick leave', 30],
      ['Lea B.', 'Oct 20 – 21', 'Vacation', 210],
      ['Noah F.', 'Nov 2 – 6', 'Vacation', 280],
    ];
    items.forEach(([n, d, k, hue], i) => {
      const y = 110 + i * 92;
      roundRect(ctx, 28, y - 30, w - 56, 76, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      ctx.fill();
      ctx.strokeStyle = STEEL;
      ctx.lineWidth = 1;
      ctx.stroke();
      avatar(ctx, 66, y + 8, 18, hue);
      text(ctx, n, 98, y + 2, 17);
      text(ctx, `${d} · ${k}`, 98, y + 26, 14, MIST, 400);
      if (i === 0) {
        pill(ctx, 'Approve', w - 206, y - 8, accent, true);
      } else {
        pill(ctx, 'Review', w - 190, y - 8, accent);
      }
    });
  });
}

/** Thin telemetry strip under the panels. */
export function createStripTexture(accent: string) {
  return makeTexture(1024, 160, (ctx, w, h) => {
    panel(ctx, w, h);
    const items = ['Sync 00:00:12', '3 approvals pending', 'Balances current', 'Policy v4', 'Uptime 99.98%'];
    let x = 40;
    items.forEach((t, i) => {
      ctx.beginPath();
      ctx.arc(x, h / 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = i === 1 ? accent : 'rgba(255,255,255,0.35)';
      ctx.fill();
      label(ctx, t, x + 18, h / 2 + 6, i === 1 ? SILVER : MIST, 15);
      ctx.font = `500 15px ${MONO}`;
      x += ctx.measureText(t.toUpperCase()).width * 1.14 + 70;
    });
  });
}

/** The Lab — prototypes with progress bars. */
export function createLabTexture(accent: string) {
  return makeTexture(768, 512, (ctx, w, h) => {
    panel(ctx, w, h);
    text(ctx, 'The Lab', 36, 50, 22);
    label(ctx, '3 prototypes running', 36, 80);
    const items: [string, number][] = [['Pocket timer', 0.82], ['Receipt splitter', 0.46], ['Focus sounds', 0.27]];
    items.forEach(([n, p], i) => {
      const y = 140 + i * 100;
      text(ctx, n, 36, y, 18);
      label(ctx, `${Math.round(p * 100)}%`, w - 90, y, MIST, 13);
      roundRect(ctx, 36, y + 22, w - 72, 10, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      roundRect(ctx, 36, y + 22, (w - 72) * p, 10, 5);
      ctx.fillStyle = accent;
      ctx.fill();
      text(ctx, 'Offline · no account · on-device data', 36, y + 56, 13, MIST, 400);
    });
  });
}

/** FJALË letter tile face. */
export function createLetterTexture(letter: string, accent: string, highlight: boolean) {
  return makeTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 6, 6, w - 12, h - 12, 26);
    ctx.fillStyle = highlight ? accent : '#15181F';
    ctx.fill();
    ctx.strokeStyle = highlight ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = `500 150px ${FONT}`;
    ctx.fillStyle = highlight ? '#0E0F12' : SILVER;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, w / 2, h / 2 + 8);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  });
}
