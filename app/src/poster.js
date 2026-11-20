// poster.js — the film-poster furniture of Neon Coast Cover Studio: the
// retro-chrome 3D title, the neon script subtitle, role tags, quote bar,
// ribbon, billing block, circular seal and barcode. Everything is drawn on
// the cover canvas itself, so the exported PNG carries the whole poster.

export const TITLE = 'NEON COAST';
export const SUBTITLE = 'Paid in Sunsets';
export const QUOTE = '“The most wanted sunset in Leonida”';
export const RIBBON = 'EVERYONE WANTS A CUT OF THE SUNSET';
export const BILLING =
  'NEON COAST  •  A LEONIDA STORY  •  STARRING THE DRIVER  THE CAPTAIN  THE ARTIST  THE LOOKOUT  THE SINGER';
export const BILLING_2 =
  'DIRECTED BY NEON COAST STUDIO  •  MUSIC BY THE STAGE SINGER  •  SHOT ON LEONIDA BOULEVARD';

// A subtle halftone dot field, drawn once into an offscreen canvas and
// tiled over the title block. Kept faint on purpose: texture, not noise.
export function halftonePattern(ctx, size, spacing, alpha) {
  const tile = document.createElement('canvas');
  tile.width = spacing;
  tile.height = spacing;
  const t = tile.getContext('2d');
  t.fillStyle = `rgba(255,255,255,${alpha})`;
  t.beginPath();
  t.arc(spacing / 2, spacing / 2, size / 2, 0, Math.PI * 2);
  t.fill();
  return ctx.createPattern(tile, 'repeat');
}

// Retro-chrome 3D title. One measurement, one centred position — the text
// is drawn with textAlign 'left' from a single computed x, so it can never
// double-centre or slide off the canvas. Returns the title's bounding box.
export function drawChromeTitle(ctx, text, cx, top, width, fonts) {
  // `width` is the limiting width the caller passes (already the smaller
  // of the title-block width and a height-derived bound), so the title
  // always fits its block at every canvas size.
  const size = Math.min(width * 0.135, 150);
  ctx.save();
  ctx.font = `${size}px ${fonts.display}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const tw = ctx.measureText(text).width;
  // Slight skew for the retro lean, pivoting around the title centre.
  ctx.translate(cx, top);
  ctx.transform(1, 0, -0.06, 1, 0, 0);
  const x = -tw / 2;
  // Extrusion: layered offsets, darkest first, stepping up-left.
  const layers = [
    ['#3d0a4d', 10], ['#5c1168', 8], ['#7a1a80', 6],
    ['#a12a8c', 4], ['#c93a92', 2],
  ];
  for (const [color, dy] of layers) {
    ctx.fillStyle = color;
    ctx.fillText(text, x, dy);
  }
  // Chrome face: silver -> gold -> pink, top to bottom.
  const grad = ctx.createLinearGradient(0, -size * 0.72, 0, size * 0.22);
  grad.addColorStop(0.0, '#ffffff');
  grad.addColorStop(0.32, '#e8ecf4');
  grad.addColorStop(0.55, '#f7c948');
  grad.addColorStop(0.78, '#ff7ab8');
  grad.addColorStop(1.0, '#ff4d94');
  ctx.fillStyle = grad;
  ctx.fillText(text, x, 0);
  // Top highlight + thin dark outline to lift the letters off the block.
  ctx.strokeStyle = 'rgba(20,4,32,0.55)';
  ctx.lineWidth = Math.max(1, size * 0.012);
  ctx.strokeText(text, x, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(x + tw * 0.06, -size * 0.66, tw * 0.5, Math.max(2, size * 0.03));
  ctx.restore();
  return { x: cx - tw / 2, y: top - size * 0.72, w: tw, h: size * 0.95 };
}

export function drawNeonSubtitle(ctx, text, cx, y, size, fonts) {
  ctx.save();
  ctx.font = `${size}px ${fonts.script}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = size * 0.55;
  ctx.fillStyle = '#ffd7ea';
  ctx.fillText(text, cx, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, cx, y);
  ctx.restore();
}

export function drawRoleTag(ctx, text, x, y, scale, maxWidth) {
  ctx.save();
  // Shrink the tag to fit narrow panels (portrait/square side slots are
  // barely wider than the text): measure, then step the font down until
  // the tag fits its max width instead of spilling past the panel edge.
  let fontSize = Math.round(15 * scale);
  ctx.font = `700 ${fontSize}px ${'Arial, sans-serif'}`;
  const pad = 8 * scale;
  let w = ctx.measureText(text).width + pad * 2;
  while (maxWidth && w > maxWidth && fontSize > 7) {
    fontSize -= 1;
    ctx.font = `700 ${fontSize}px ${'Arial, sans-serif'}`;
    w = ctx.measureText(text).width + pad * 2;
  }
  const h = 24 * scale;
  ctx.fillStyle = '#0d0416';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#f2b705';
  ctx.fillRect(x, y + h - 3 * scale, w, 3 * scale);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + h / 2 - 1 * scale);
  ctx.restore();
  return { w, h };
}

export function drawQuoteBar(ctx, text, x, y, width, scale, fonts) {
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f2b705';
  const star = '★'.repeat(5);
  ctx.font = `${Math.round(17 * scale)}px ${'Arial, sans-serif'}`;
  ctx.textAlign = 'left';
  ctx.fillText(star, x, y);
  const sw = ctx.measureText(star).width;
  ctx.fillStyle = '#fff3d6';
  ctx.font = `italic ${Math.round(16 * scale)}px Georgia, serif`;
  ctx.fillText(text, x + sw + 10 * scale, y);
  ctx.restore();
}

export function drawRibbon(ctx, text, cx, y, width, height, fonts) {
  ctx.save();
  const x = cx - width / 2;
  // Folded ends.
  ctx.fillStyle = '#c2185b';
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x - 16, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + width + 16, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width + 16, y + height);
  ctx.closePath();
  ctx.fill();
  // Body with a soft vertical shade.
  const grad = ctx.createLinearGradient(0, y, 0, y + height);
  grad.addColorStop(0, '#ff5c9e');
  grad.addColorStop(1, '#ff2e88');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${Math.round(height * 0.52)}px ${fonts.display}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + height / 2 + 1);
  ctx.restore();
}

export function drawBilling(ctx, lines, cx, y, width, scale) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,243,214,0.82)';
  // Fit the billing inside `width`: step the font down until the longest
  // line fits, so it never runs under the barcode or into the seal.
  let fontSize = Math.round(11 * scale);
  ctx.font = `${fontSize}px ${'Arial, sans-serif'}`;
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  while (widest > width && fontSize > 7) {
    fontSize -= 1;
    ctx.font = `${fontSize}px ${'Arial, sans-serif'}`;
    if (Math.max(...lines.map((line) => ctx.measureText(line).width)) <= width) break;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, y + i * 15 * scale);
  });
  ctx.restore();
}

export function drawSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.strokeStyle = '#f2b705';
  ctx.fillStyle = '#2a1038';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f2b705';
  ctx.font = `${Math.round(r * 0.62)}px ${'Arial, sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 0, -r * 0.16);
  ctx.font = `700 ${Math.round(r * 0.3)}px ${'Arial, sans-serif'}`;
  ctx.fillText('2026', 0, r * 0.34);
  ctx.restore();
}

export function drawBarcode(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#0d0416';
  let bx = x + 4;
  let i = 0;
  while (bx < x + w - 4) {
    const bw = [2, 1, 3, 1, 2, 4, 1, 2][i % 8];
    if (i % 2 === 0) ctx.fillRect(bx, y + 3, bw, h - 6);
    bx += bw + 2;
    i += 1;
  }
  ctx.restore();
}

export function drawChip(ctx, text, x, y, scale, fonts) {
  ctx.save();
  ctx.font = `700 ${Math.round(13 * scale)}px ${fonts.display}`;
  const pad = 9 * scale;
  const w = ctx.measureText(text).width + pad * 2;
  const h = 22 * scale;
  ctx.fillStyle = '#f2b705';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#0d0416';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + h / 2 + 1);
  ctx.restore();
  return w;
}

export function drawVolumeChip(ctx, text, x, y, scale) {
  // `x` is the chip's RIGHT edge, so callers can pin it to the canvas
  // edge without measuring the text first; the chip never runs off-canvas.
  ctx.save();
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = Math.max(1.5, 2 * scale);
  ctx.fillStyle = 'rgba(13,4,22,0.6)';
  ctx.font = `700 ${Math.round(13 * scale)}px ${'Arial, sans-serif'}`;
  const pad = 8 * scale;
  const w = ctx.measureText(text).width + pad * 2;
  const h = 22 * scale;
  const x0 = x - w;
  ctx.fillRect(x0, y, w, h);
  ctx.strokeRect(x0, y, w, h);
  ctx.fillStyle = '#f2b705';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x0 + pad, y + h / 2 + 1);
  ctx.restore();
  return w;
}
