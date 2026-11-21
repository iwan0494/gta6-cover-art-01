// Neon Coast Cover Studio — poster furniture, drawn on canvas.
//
// The title, ribbon, billing and the rest are drawn, not typeset in HTML,
// so the exported PNGs look exactly like the preview. Every piece of text
// is measured once and placed from that one measurement: the title is
// never centred twice, and tags and billing shrink until they fit instead
// of running off the panel edge.

(function () {
  'use strict';

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A five-pointed star path at (cx, cy) with outer radius r.
  function starPath(ctx, cx, cy, r) {
    var inner = r * 0.42;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var rad = i % 2 === 0 ? r : inner;
      var ang = -Math.PI / 2 + (i * Math.PI) / 5;
      var x = cx + rad * Math.cos(ang);
      var y = cy + rad * Math.sin(ang);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // Fit a font size so the text fits maxW: start big, shrink, measure.
  function fitFont(ctx, text, family, startPx, maxW, weight) {
    var px = startPx;
    var font = function (s) {
      return (weight ? weight + ' ' : '') + s + 'px ' + family;
    };
    ctx.font = font(px);
    while (px > 8 && ctx.measureText(text).width > maxW) {
      px -= 1;
      ctx.font = font(px);
    }
    return px;
  }

  // The chrome 3D title: one measurement, one x. Extrusion layers first
  // (dark, stepped down-right), then the chrome gradient fill, a dark
  // outline, and a white sheen clipped to the top half.
  function chromeTitle(ctx, text, W, yTop, height, grade) {
    var maxW = W * 0.86;
    var px = fitFont(ctx, text, 'Anton, "Arial Narrow", sans-serif', height * 0.72, maxW, '');
    var font = px + 'px Anton, "Arial Narrow", sans-serif';
    ctx.font = font;
    var tw = ctx.measureText(text).width;
    var x = (W - tw) / 2;
    var baseline = yTop + height * 0.62;
    ctx.save();
    ctx.translate(-W * 0.004, 0);
    ctx.transform(1, 0, -0.05, 1, 0, 0);
    var grad = ctx.createLinearGradient(0, yTop, 0, yTop + height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.32, '#ffe9a8');
    grad.addColorStop(0.55, '#f2b705');
    grad.addColorStop(0.78, '#ff7a3d');
    grad.addColorStop(1, '#ff2e88');
    var shades = ['#2a0a2e', '#3d0f42', '#571357', '#6e1a5e'];
    for (var i = 0; i < shades.length; i++) {
      ctx.fillStyle = shades[i];
      ctx.fillText(text, x + (i + 1) * 2.2, baseline + (i + 1) * 2.4);
    }
    ctx.fillStyle = grad;
    ctx.fillText(text, x, baseline);
    ctx.lineWidth = Math.max(1.5, px * 0.03);
    ctx.strokeStyle = '#1c0518';
    ctx.strokeText(text, x, baseline);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 4, yTop, tw + 8, height * 0.48);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillText(text, x, baseline);
    ctx.restore();
    ctx.restore();
    return { x: x, width: tw, size: px };
  }

  function neonSubtitle(ctx, text, W, yTop, height) {
    var maxW = W * 0.6;
    var px = fitFont(ctx, text, 'Pacifico, cursive', height * 0.5, maxW, '');
    ctx.font = px + 'px Pacifico, cursive';
    var tw = ctx.measureText(text).width;
    var x = (W - tw) / 2;
    ctx.save();
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = px * 0.45;
    ctx.fillStyle = '#fff0f7';
    ctx.fillText(text, x, yTop + height * 0.62);
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = px * 0.2;
    ctx.fillText(text, x, yTop + height * 0.62);
    ctx.restore();
  }

  // A role tag pinned to a panel's top-left corner, shrunk to fit.
  function drawRoleTag(ctx, label, panel) {
    if (!label) return;
    var tagH = Math.max(13, Math.min(panel.h * 0.1, 26));
    var px = fitFont(ctx, label, 'Anton, "Arial Narrow", sans-serif', tagH * 0.66, panel.w - 10, '');
    ctx.font = px + 'px Anton, "Arial Narrow", sans-serif';
    var tw = ctx.measureText(label).width;
    var w = tw + 12;
    var h = tagH;
    ctx.save();
    ctx.fillStyle = 'rgba(10,5,18,0.92)';
    ctx.fillRect(panel.x, panel.y, w, h);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#f2b705';
    ctx.strokeRect(panel.x + 0.5, panel.y + 0.5, w, h);
    ctx.fillStyle = '#ffd76a';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, panel.x + 6, panel.y + h / 2 + 0.5);
    ctx.restore();
  }

  function drawEditionChip(ctx, panel) {
    var label = 'SUNSET EDITION';
    var tagH = Math.max(14, Math.min(panel.h * 0.085, 24));
    var px = fitFont(ctx, label, 'Anton, "Arial Narrow", sans-serif', tagH * 0.62, panel.w * 0.32, '');
    ctx.font = px + 'px Anton, "Arial Narrow", sans-serif';
    var tw = ctx.measureText(label).width;
    var w = tw + 12;
    ctx.save();
    ctx.fillStyle = '#f2b705';
    ctx.fillRect(panel.x + panel.w - w, panel.y, w, tagH);
    ctx.fillStyle = '#1c0518';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, panel.x + panel.w - w + 6, panel.y + tagH / 2 + 0.5);
    ctx.restore();
  }

  function drawQuoteBar(ctx, W, y, h) {
    var starR = h * 0.32;
    var x = W * 0.02;
    ctx.save();
    ctx.fillStyle = '#f2b705';
    for (var i = 0; i < 5; i++) {
      starPath(ctx, x + starR + i * starR * 2.3, y + h / 2, starR);
      ctx.fill();
    }
    var textX = x + starR * 2.3 * 5 + W * 0.012;
    var px = fitFont(ctx, '\u201cThe most wanted sunset in Leonida\u201d', 'italic Georgia, serif', h * 0.62, W * 0.62, '');
    ctx.font = 'italic ' + px + 'px Georgia, serif';
    ctx.fillStyle = '#e8d9f2';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u201cThe most wanted sunset in Leonida\u201d', textX, y + h / 2 + 0.5);
    ctx.restore();
  }

  function drawRibbon(ctx, text, W, y, h) {
    var notch = h * 0.55;
    var x0 = W * 0.13;
    var x1 = W * 0.87;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(x0 + notch, y + 5);
    ctx.lineTo(x1 - notch, y + 5);
    ctx.lineTo(x1, y + h / 2 + 5);
    ctx.lineTo(x1 - notch, y + h + 5);
    ctx.lineTo(x0 + notch, y + h + 5);
    ctx.lineTo(x0, y + h / 2 + 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.moveTo(x0 + notch, y);
    ctx.lineTo(x1 - notch, y);
    ctx.lineTo(x1, y + h / 2);
    ctx.lineTo(x1 - notch, y + h);
    ctx.lineTo(x0 + notch, y + h);
    ctx.lineTo(x0, y + h / 2);
    ctx.closePath();
    ctx.fill();
    var px = fitFont(ctx, text, 'Anton, "Arial Narrow", sans-serif', h * 0.58, x1 - x0 - notch * 2 - 16, '');
    ctx.font = px + 'px Anton, "Arial Narrow", sans-serif';
    var tw = ctx.measureText(text).width;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, (W - tw) / 2, y + h / 2 + 0.5);
    ctx.restore();
  }

  // Billing block, left-aligned at x, shrunk to fit maxW. The caller
  // places it to the right of COMING SOON so the two never collide.
  function drawBilling(ctx, x, y, maxW) {
    var lines = [
      'NEON COAST  \u2022  A LEONIDA STORY  \u2022  STARRING THE DRIVER  THE CAPTAIN  THE ARTIST  THE LOOKOUT  THE SINGER',
      'DIRECTED BY NEON COAST STUDIO  \u2022  MUSIC BY THE STAGE SINGER  \u2022  SHOT ON LEONIDA BOULEVARD',
    ];
    var px = fitFont(ctx, lines[0], '"Arial Narrow", sans-serif', 13, maxW, '');
    ctx.save();
    ctx.fillStyle = 'rgba(232,217,242,0.75)';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = px + 'px "Arial Narrow", sans-serif';
    ctx.fillText(lines[0], x, y);
    ctx.fillText(lines[1], x, y + px * 1.5);
    ctx.restore();
  }

  function drawBarcode(ctx, x, y, w, h) {
    var rnd = mulberry32(4242);
    ctx.save();
    ctx.fillStyle = '#f4f0e6';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#111111';
    var bx = x + 2;
    while (bx < x + w - 2) {
      var bw = 1 + Math.floor(rnd() * 3);
      if (rnd() > 0.45) ctx.fillRect(bx, y + 2, bw, h - 4);
      bx += bw + 1 + Math.floor(rnd() * 2);
    }
    ctx.restore();
  }

  function drawSeal(ctx, cx, cy, r) {
    ctx.save();
    ctx.lineWidth = Math.max(1.5, r * 0.09);
    ctx.strokeStyle = '#f2b705';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f2b705';
    starPath(ctx, cx, cy - r * 0.22, r * 0.3);
    ctx.fill();
    ctx.font = Math.max(8, r * 0.42) + 'px Anton, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2026', cx, cy + r * 0.42);
    ctx.restore();
  }

  function drawVolChip(ctx, W, y) {
    var label = 'VOL. 1';
    var px = Math.max(11, W * 0.013);
    ctx.save();
    ctx.font = px + 'px Anton, sans-serif';
    var w = ctx.measureText(label).width + 14;
    var h = px + 8;
    var x = W - w - W * 0.012;
    ctx.fillStyle = 'rgba(10,5,18,0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#f2b705';
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    ctx.fillStyle = '#ffd76a';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 7, y + h / 2 + 0.5);
    ctx.restore();
  }

  function drawComingSoon(ctx, x, y, h) {
    var label = 'COMING SOON';
    var px = fitFont(ctx, label, 'Anton, sans-serif', h * 0.7, 400, '');
    ctx.save();
    ctx.font = px + 'px Anton, sans-serif';
    ctx.fillStyle = '#f2b705';
    ctx.textBaseline = 'middle';
    var w = ctx.measureText(label).width;
    ctx.fillText(label, x, y + h / 2 + 0.5);
    ctx.restore();
    return w;
  }

  // All the furniture, in the poster's own coordinate plan.
  function drawFurniture(ctx, W, H, opts) {
    var title = opts.title || 'NEON COAST';
    var subtitle = opts.subtitle || 'Paid in Sunsets';
    var bleed = !!opts.bleed;

    drawVolChip(ctx, W, H * 0.008);
    drawQuoteBar(ctx, W, H * 0.012, H * 0.038);

    // Title block: dark slab, gold frame, faint halftone dots.
    var bx = W * 0.045;
    var by = H * 0.49;
    var bw = W * 0.91;
    var bh = H * 0.145;
    ctx.save();
    ctx.fillStyle = bleed ? 'rgba(16,7,26,0.88)' : '#1e0d2b';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(242,183,5,0.10)';
    var step = Math.max(9, W / 110);
    for (var hx = bx + step; hx < bx + bw - 4; hx += step) {
      for (var hy = by + step; hy < by + bh - 4; hy += step) {
        ctx.beginPath();
        ctx.arc(hx, hy, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.lineWidth = Math.max(1.5, W * 0.0016);
    ctx.strokeStyle = '#f2b705';
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();

    chromeTitle(ctx, title, W, by + bh * 0.06, bh * 0.62, opts.grade);
    neonSubtitle(ctx, subtitle, W, by + bh * 0.66, bh * 0.3);

    drawRibbon(ctx, 'EVERYONE WANTS A CUT OF THE SUNSET', W, H * 0.655, H * 0.05);

    // Footer: barcode + coming soon on the left, billing to their right,
    // seal right. Billing starts after the measured COMING SOON width —
    // centred billing used to run underneath it on portrait canvases.
    var fy = H * 0.935;
    var fh = H * 0.05;
    var barW = W * 0.07;
    drawBarcode(ctx, W * 0.015, fy, barW, fh);
    var comingX = W * 0.015 + barW + W * 0.01;
    var comingW = drawComingSoon(ctx, comingX, fy, fh);
    var billX = comingX + comingW + W * 0.015;
    var sealL = W * 0.965 - Math.min(W, H) * 0.032;
    drawBilling(ctx, billX, fy + fh * 0.32, sealL - billX - W * 0.012);
    drawSeal(ctx, W * 0.965, fy + fh / 2, Math.min(W, H) * 0.032);
  }

  window.NC.poster = {
    chromeTitle: chromeTitle,
    neonSubtitle: neonSubtitle,
    drawRoleTag: drawRoleTag,
    drawEditionChip: drawEditionChip,
    drawQuoteBar: drawQuoteBar,
    drawRibbon: drawRibbon,
    drawBilling: drawBilling,
    drawBarcode: drawBarcode,
    drawSeal: drawSeal,
    drawVolChip: drawVolChip,
    drawComingSoon: drawComingSoon,
    drawFurniture: drawFurniture,
  };
})();
