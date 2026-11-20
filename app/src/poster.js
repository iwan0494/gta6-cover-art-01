// Neon Coast Cover Studio — poster furniture drawn on canvas.
//
// The chrome title is the memorable element: a silver-to-gold-to-pink
// vertical gradient, extruded with offset dark layers, a crisp white
// highlight pass, and a slight skew. Everything else (role tags, ribbon,
// billing, seal, barcode, quote bar) is drawn in the same ink-and-gold
// language so the cover reads as one poster, not a grid of photos.

export const INK = "#14071d";
export const GOLD = "#f2b705";
export const PINK = "#ff2e88";
export const CREAM = "#fff3d6";

// A small reusable halftone dot tile, drawn once and stamped as a pattern.
export function halftoneTile(size = 14, dot = 3.4, color = "#000000") {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  g.fillStyle = color;
  g.beginPath();
  g.arc(size / 2, size / 2, dot, 0, Math.PI * 2);
  g.fill();
  return c;
}

export function paintHalftone(ctx, x, y, w, h, alpha = 0.16) {
  const tile = halftoneTile();
  const pat = ctx.createPattern(tile, "repeat");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pat;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// Inked panel frame: thick ink outline, gold hairline, and a 1px pure-white
// low-opacity edge on the photo itself (the "printed" look).
export function inkFrame(ctx, x, y, w, h, gold = GOLD) {
  ctx.save();
  ctx.lineJoin = "miter";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(4, w * 0.012);
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = gold;
  ctx.lineWidth = Math.max(1.5, w * 0.004);
  ctx.strokeRect(x + ctx.lineWidth * 2.5, y + ctx.lineWidth * 2.5, w - ctx.lineWidth * 5, h - ctx.lineWidth * 5);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.restore();
}

// Role tag: black slash-cut chip with a gold underline, top-left of a panel.
export function roleTag(ctx, text, x, y, fontPx) {
  ctx.save();
  ctx.font = `900 ${fontPx}px Anton, sans-serif`;
  const pad = fontPx * 0.42;
  const tw = ctx.measureText(text).width;
  const w = tw + pad * 2;
  const h = fontPx * 1.5;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - fontPx * 0.28, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + pad, y + h / 2 + 1);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y + h, w - fontPx * 0.28, Math.max(2, fontPx * 0.12));
  ctx.restore();
  return w;
}

// Chrome 3D title. Centring is computed ONCE from the measured width and
// drawn with textAlign "left" — never translate(-w/2) on top of a centred
// alignment, which is how a title ends up shifted half its width.
export function chromeTitle(ctx, text, cx, top, maxW, fontPx) {
  ctx.save();
  ctx.font = `${fontPx}px Anton, sans-serif`;
  let size = fontPx;
  let tw = ctx.measureText(text).width;
  while (tw > maxW && size > 24) {
    size *= 0.94;
    ctx.font = `${size}px Anton, sans-serif`;
    tw = ctx.measureText(text).width;
  }
  const x = cx - tw / 2;
  const skew = -0.045;
  ctx.transform(1, 0, skew, 1, -skew * top, 0);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  // Extrusion: stacked dark layers marching down-right.
  const layers = 7;
  for (let i = layers; i >= 1; i--) {
    ctx.fillStyle = i % 2 === 0 ? "#3d0a4e" : "#1c0526";
    ctx.fillText(text, x + i * size * 0.022, top + size + i * size * 0.03);
  }
  // Chrome face: silver -> gold -> pink, top to bottom.
  const grad = ctx.createLinearGradient(0, top, 0, top + size * 1.05);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.34, "#e8e4da");
  grad.addColorStop(0.52, "#f2b705");
  grad.addColorStop(0.72, "#ff9ecf");
  grad.addColorStop(1, "#ff2e88");
  ctx.fillStyle = grad;
  ctx.fillText(text, x, top + size);
  // Top highlight: same text, clipped to its upper third, in white.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - size * 0.1, top, tw + size * 0.2, size * 0.32);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(text, x, top + size);
  ctx.restore();
  // Thin dark outline so the chrome holds against bright photos.
  ctx.strokeStyle = "rgba(20,7,29,0.55)";
  ctx.lineWidth = Math.max(1, size * 0.012);
  ctx.strokeText(text, x, top + size);
  ctx.restore();
  return { x, width: tw, height: size * 1.35 };
}

// Neon script subtitle (Pacifico) with a pink glow.
export function neonScript(ctx, text, cx, top, fontPx) {
  ctx.save();
  ctx.font = `${fontPx}px Pacifico, cursive`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = PINK;
  ctx.shadowBlur = fontPx * 0.55;
  ctx.fillStyle = "#ffd7ea";
  ctx.fillText(text, cx, top + fontPx);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, cx, top + fontPx);
  ctx.restore();
}

// Pink ribbon with folded ends.
export function ribbon(ctx, text, cx, y, w, h) {
  ctx.save();
  const x = cx - w / 2;
  ctx.font = `900 ${h * 0.52}px Anton, sans-serif`;
  ctx.fillStyle = "#d61f6e";
  ctx.beginPath();
  ctx.moveTo(x - h * 0.5, y + h * 0.18);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - h * 0.5, y + h * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w + h * 0.5, y + h * 0.18);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w + h * 0.5, y + h * 0.82);
  ctx.closePath();
  ctx.fill();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "#ff5da2");
  grad.addColorStop(1, "#ff2e88");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, y + h / 2 + 1);
  ctx.restore();
}

// Two-line billing block, centred, small caps.
export function billing(ctx, lines, cx, top, fontPx, color = "rgba(255,243,214,0.72)") {
  ctx.save();
  ctx.font = `${fontPx}px Anton, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  lines.forEach((ln, i) => ctx.fillText(ln, cx, top + fontPx * (i + 1)));
  ctx.restore();
}

// Circular gold seal with a star and the year.
export function seal(ctx, cx, cy, r, year = "2026") {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#2a0a2e";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath();
  ctx.arc(0, 0, r - ctx.lineWidth, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(242,183,5,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  drawStar(ctx, 0, -r * 0.18, r * 0.34, GOLD);
  ctx.fillStyle = GOLD;
  ctx.font = `900 ${r * 0.34}px Anton, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(year, 0, r * 0.42);
  ctx.restore();
}

export function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Barcode: random-width bars, deterministic seed so exports are stable.
export function barcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 4, y - 3, w + 8, h + 6);
  ctx.fillStyle = "#111111";
  let seed = 1234567;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  let px = x;
  while (px < x + w - 3) {
    const bw = 1 + Math.floor(rnd() * 4);
    if (rnd() > 0.42) ctx.fillRect(px, y, bw, h);
    px += bw + 1 + Math.floor(rnd() * 3);
  }
  ctx.restore();
}

// Quote bar: five gold stars + italic quote, top of the cover.
export function quoteBar(ctx, text, x, y, fontPx, maxW) {
  ctx.save();
  let sx = x;
  const sr = fontPx * 0.42;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, sx + sr, y + sr, sr, GOLD);
    sx += sr * 2.3;
  }
  ctx.fillStyle = "#ffe9f4";
  ctx.font = `italic ${fontPx}px Georgia, serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, sx + fontPx * 0.5, y + sr + 1);
  ctx.restore();
}
