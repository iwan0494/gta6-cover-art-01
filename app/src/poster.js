// poster.js — movie-poster furniture drawn on canvas: chrome title, halftone,
// role tags, ribbon, seal, barcode, billing, quote bar. All invented copy;
// no Rockstar marks, no official artwork.

export const TITLE = "NEON COAST";
export const SUBTITLE = "Paid in Sunsets";
export const QUOTE = "The most wanted sunset in Leonida";
export const RIBBON_TEXT = "EVERYONE WANTS A CUT OF THE SUNSET";
export const BILLING = [
  "NEON COAST  •  A LEONIDA STORY  •  STARRING THE DRIVER  THE CAPTAIN  THE ARTIST  THE LOOKOUT  THE SINGER",
  "DIRECTED BY NEON COAST STUDIO  •  MUSIC BY THE STAGE SINGER  •  SHOT ON LEONIDA BOULEVARD",
];

const GOLD = "#f2c14e";
const MAGENTA = "#ff2e88";
const INK = "#160a18";

// Diamond-dot halftone field.
export function halftone(ctx, x, y, w, h, step, color, alpha = 0.55) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const r = Math.max(1, step * 0.22);
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      ctx.save();
      ctx.translate(xx, yy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.restore();
    }
  }
  ctx.restore();
}

// Retro-chrome 3D title: layered extrusion, chrome gradient, dark outline, top shine.
export function chromeTitle(ctx, text, cx, top, px, opts = {}) {
  const skew = opts.skew ?? -0.04;
  const font = `${px}px Anton, "Arial Narrow", sans-serif`;
  ctx.save();
  ctx.textAlign = "left"; // centring is done manually via -w/2 below
  ctx.textBaseline = "top";
  ctx.font = font;
  // measure once, then draw every pass with the same transform
  const w = ctx.measureText(text).width;
  // never overflow the band: scale the whole title down if it is too wide
  const scale = opts.maxWidth && w > opts.maxWidth ? opts.maxWidth / w : 1;
  ctx.translate(cx, top);
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.scale(scale, scale);
  ctx.translate(-w / 2, 0);
  // extrusion: dark layers stepping down-right
  const layers = opts.layers ?? 6;
  for (let i = layers; i >= 1; i--) {
    ctx.fillStyle = i % 2 ? "#3d0a2e" : "#12060f";
    ctx.fillText(text, i * px * 0.022, i * px * 0.028);
  }
  // chrome gradient: silver -> gold -> pink, top to bottom
  const g = ctx.createLinearGradient(0, 0, 0, px * 1.05);
  g.addColorStop(0.0, "#ffffff");
  g.addColorStop(0.28, "#e8e4da");
  g.addColorStop(0.52, "#f2c14e");
  g.addColorStop(0.74, "#ff8fb8");
  g.addColorStop(1.0, "#ff2e88");
  ctx.fillStyle = g;
  ctx.fillText(text, 0, 0);
  // outline + top shine
  ctx.lineWidth = Math.max(2, px * 0.02);
  ctx.strokeStyle = "#1c0a18";
  ctx.strokeText(text, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-w * 0.02, px * 0.06, w * 1.04, px * 0.05);
  ctx.restore();
  ctx.restore();
  return w;
}

// Neon script subtitle (Pacifico) with glow.
export function scriptSubtitle(ctx, text, cx, top, px) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `${px}px Pacifico, cursive`;
  ctx.shadowColor = MAGENTA;
  ctx.shadowBlur = px * 0.35;
  ctx.fillStyle = "#ffd7ea";
  ctx.fillText(text, cx, top);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, cx, top - px * 0.03);
  ctx.restore();
}

// Slanted black role tag with gold underline.
export function roleTag(ctx, x, y, label, px) {
  ctx.save();
  ctx.font = `${px}px Anton, "Arial Narrow", sans-serif`;
  const tw = ctx.measureText(label).width;
  const pad = px * 0.55;
  const w = tw + pad * 2;
  const h = px * 1.5;
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.08, 1, 0, 0);
  ctx.fillStyle = "rgba(10,4,10,0.92)";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, h - px * 0.14, w, px * 0.14);
  ctx.fillStyle = "#fff6e0";
  ctx.textBaseline = "middle";
  ctx.fillText(label, pad, h / 2 - px * 0.04);
  ctx.restore();
  return w;
}

// Pink ribbon with folded ends.
export function ribbon(ctx, cx, top, w, text, px) {
  const h = px * 1.9;
  const fold = px * 0.9;
  ctx.save();
  ctx.font = `${px}px Anton, "Arial Narrow", sans-serif`;
  // folded ends
  ctx.fillStyle = "#8f1145";
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - fold, top + h * 0.18);
  ctx.lineTo(cx - w / 2, top);
  ctx.lineTo(cx - w / 2, top + h);
  ctx.lineTo(cx - w / 2 - fold, top + h * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + w / 2 + fold, top + h * 0.18);
  ctx.lineTo(cx + w / 2, top);
  ctx.lineTo(cx + w / 2, top + h);
  ctx.lineTo(cx + w / 2 + fold, top + h * 0.82);
  ctx.closePath();
  ctx.fill();
  // body
  ctx.fillStyle = MAGENTA;
  ctx.fillRect(cx - w / 2, top, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, top + h / 2 + px * 0.04);
  ctx.restore();
}

// Circular gold seal with a star and year, text on an arc.
export function seal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#2a0a24";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.strokeStyle = GOLD;
  ctx.beginPath();
  ctx.arc(0, 0, r - ctx.lineWidth, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  // arc text
  ctx.fillStyle = GOLD;
  ctx.font = `bold ${r * 0.24}px Anton, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const word = "NEON COAST • LEONIDA • ";
  const step = (Math.PI * 1.5) / word.length;
  for (let i = 0; i < word.length; i++) {
    const a = -Math.PI * 0.75 + i * step;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(0, -r * 0.88);
    ctx.fillText(word[i], 0, 0);
    ctx.restore();
  }
  // star
  ctx.fillStyle = GOLD;
  const sr = r * 0.3;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? sr * 0.45 : sr;
    ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff6e0";
  ctx.font = `bold ${r * 0.34}px Anton, sans-serif`;
  ctx.fillText("2026", 0, r * 0.52);
  ctx.restore();
}

// Deterministic barcode (seeded bars, no randomness at draw time).
export function barcode(ctx, x, y, w, h, seed = 7) {
  let s = seed;
  const next = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.save();
  ctx.fillStyle = "#f4efe2";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#111";
  let px = x + w * 0.04;
  while (px < x + w * 0.96) {
    const bw = 1 + next() * (w * 0.03);
    if (next() > 0.42) ctx.fillRect(px, y + h * 0.06, bw, h * 0.88);
    px += bw + 1 + next() * (w * 0.02);
  }
  ctx.restore();
}

// Tiny centred billing lines.
export function billing(ctx, cx, y, lines, px, color = "#cbb8c2") {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  ctx.font = `${px}px "Arial Narrow", Arial, sans-serif`;
  lines.forEach((line, i) => ctx.fillText(line, cx, y + i * px * 1.5));
  ctx.restore();
}

// Five gold stars.
export function stars(ctx, x, y, px, n = 5) {
  ctx.save();
  ctx.fillStyle = GOLD;
  for (let i = 0; i < n; i++) {
    const cx = x + i * px * 1.5;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? px * 0.22 : px * 0.5;
      ctx[k ? "lineTo" : "moveTo"](cx + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
