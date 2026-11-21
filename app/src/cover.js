// Neon Coast Cover Studio — the canvas renderer.
//
// A cover is built from zones, like a printed movie poster: a quote bar on
// top, a photo zone, a chrome title block, a pink ribbon, a second photo
// zone, then a billing footer. Each layout arranges the same five sample
// photos differently in the two photo zones. Every panel draws one
// (sample, shot) pair, and a face is never drawn twice on one cover — a
// sample repeats only through a faceless detail shot.

(function () {
  'use strict';

  var F = window.NC.faces;

  var GRADES = [
    { id: 'sunset', name: 'Sunset', sky: ['#ff9a3d', '#7a2d8f'], tint: 'rgba(255,110,40,0.10)', glow: 'rgba(255,154,61,0.35)' },
    { id: 'neon-night', name: 'Neon Night', sky: ['#2b1055', '#ff2e88'], tint: 'rgba(120,40,255,0.12)', glow: 'rgba(255,46,136,0.30)' },
    { id: 'teal-pink', name: 'Teal Pink', sky: ['#0f766e', '#ff5e8a'], tint: 'rgba(20,180,170,0.10)', glow: 'rgba(255,94,138,0.30)' },
    { id: 'golden-hour', name: 'Golden Hour', sky: ['#f7c948', '#c2571b'], tint: 'rgba(247,180,40,0.12)', glow: 'rgba(247,201,72,0.35)' },
    { id: 'noir', name: 'Noir', sky: ['#3a3a3a', '#0a0a0a'], tint: 'rgba(0,0,0,0.16)', glow: 'rgba(200,200,200,0.12)' },
    { id: 'vice-blue', name: 'Vice Blue', sky: ['#1d4ed8', '#0ea5e9'], tint: 'rgba(30,90,255,0.12)', glow: 'rgba(14,165,233,0.30)' },
    { id: 'heatwave', name: 'Heatwave', sky: ['#ff3d00', '#ffb300'], tint: 'rgba(255,70,0,0.12)', glow: 'rgba(255,179,0,0.35)' },
    { id: 'lavender-dusk', name: 'Lavender Dusk', sky: ['#7c5cbf', '#e879c6'], tint: 'rgba(140,90,220,0.10)', glow: 'rgba(232,121,198,0.30)' },
    { id: 'mono-gold', name: 'Mono Gold', sky: ['#8a6d1b', '#2b2113'], tint: 'rgba(190,150,50,0.12)', glow: 'rgba(220,180,80,0.30)' },
  ];

  function gradeById(id) {
    for (var i = 0; i < GRADES.length; i++) {
      if (GRADES[i].id === id) return GRADES[i];
    }
    return GRADES[0];
  }

  // Panel geometry, in fractions of the canvas. Two photo zones: the top
  // zone (y 0.06–0.465) and the bottom zone (y 0.725–0.915); the title
  // block and ribbon sit between them.
  var LAYOUTS = [
    {
      id: 'hero',
      name: 'Hero Pop-Out',
      panels: [
        { sample: 'graffiti', shot: 'face', x: 0.015, y: 0.06, w: 0.185, h: 0.405, tilt: 0 },
        { sample: 'portrait', shot: 'face', x: 0.2, y: 0.055, w: 0.52, h: 0.42, tilt: -1.5, hero: true },
        { sample: 'pier', shot: 'face', x: 0.735, y: 0.06, w: 0.115, h: 0.405, tilt: 0 },
        { sample: 'singer', shot: 'face', x: 0.86, y: 0.06, w: 0.125, h: 0.405, tilt: 0 },
        { sample: 'boulevard', shot: 'wide', x: 0.015, y: 0.725, w: 0.315, h: 0.19, tilt: 0 },
        { sample: 'pier', shot: 'detail', x: 0.345, y: 0.725, w: 0.31, h: 0.19, tilt: 0 },
        { sample: 'boulevard', shot: 'detail', x: 0.67, y: 0.725, w: 0.315, h: 0.19, tilt: 0 },
      ],
    },
    {
      id: 'hero3',
      name: 'Hero + 3',
      panels: [
        { sample: 'portrait', shot: 'face', x: 0.015, y: 0.06, w: 0.645, h: 0.405, tilt: -1 },
        { sample: 'graffiti', shot: 'face', x: 0.675, y: 0.06, w: 0.31, h: 0.135, tilt: 0 },
        { sample: 'pier', shot: 'face', x: 0.675, y: 0.205, w: 0.31, h: 0.135, tilt: 0 },
        { sample: 'singer', shot: 'face', x: 0.675, y: 0.35, w: 0.31, h: 0.135, tilt: 0 },
        { sample: 'boulevard', shot: 'wide', x: 0.015, y: 0.725, w: 0.315, h: 0.19, tilt: 0 },
        { sample: 'pier', shot: 'detail', x: 0.345, y: 0.725, w: 0.31, h: 0.19, tilt: 0 },
        { sample: 'boulevard', shot: 'detail', x: 0.67, y: 0.725, w: 0.315, h: 0.19, tilt: 0 },
      ],
    },
    {
      id: 'four',
      name: 'Four Panel',
      panels: [
        { sample: 'boulevard', shot: 'wide', x: 0.015, y: 0.06, w: 0.48, h: 0.405, tilt: 0 },
        { sample: 'portrait', shot: 'face', x: 0.505, y: 0.06, w: 0.48, h: 0.405, tilt: 0 },
        { sample: 'pier', shot: 'face', x: 0.015, y: 0.705, w: 0.48, h: 0.21, tilt: 0 },
        { sample: 'singer', shot: 'face', x: 0.505, y: 0.705, w: 0.48, h: 0.21, tilt: 0 },
      ],
    },
    {
      id: 'bleed',
      name: 'Full Bleed',
      bleed: 'portrait',
      panels: [
        { sample: 'graffiti', shot: 'detail', x: 0.03, y: 0.72, w: 0.2, h: 0.19, tilt: -2 },
        { sample: 'singer', shot: 'detail', x: 0.77, y: 0.72, w: 0.2, h: 0.19, tilt: 2 },
      ],
    },
    {
      id: 'nine',
      name: 'Nine Panel',
      panels: [
        { sample: 'boulevard', shot: 'face', x: 0.015, y: 0.06, w: 0.32, h: 0.195, tilt: 0 },
        { sample: 'portrait', shot: 'face', x: 0.345, y: 0.06, w: 0.32, h: 0.195, tilt: 0 },
        { sample: 'pier', shot: 'face', x: 0.675, y: 0.06, w: 0.31, h: 0.195, tilt: 0 },
        { sample: 'graffiti', shot: 'face', x: 0.015, y: 0.27, w: 0.32, h: 0.195, tilt: 0 },
        { sample: 'singer', shot: 'face', x: 0.345, y: 0.27, w: 0.32, h: 0.195, tilt: 0 },
        { sample: 'boulevard', shot: 'sunset', x: 0.675, y: 0.27, w: 0.31, h: 0.195, tilt: 0 },
        { sample: 'pier', shot: 'detail', x: 0.015, y: 0.725, w: 0.32, h: 0.19, tilt: 0 },
        { sample: 'portrait', shot: 'detail', x: 0.345, y: 0.725, w: 0.32, h: 0.19, tilt: 0 },
        { sample: 'singer', shot: 'detail', x: 0.675, y: 0.725, w: 0.31, h: 0.19, tilt: 0 },
      ],
    },
    {
      id: 'snapshot',
      name: 'Snapshot',
      panels: [
        { sample: 'portrait', shot: 'face', x: 0.06, y: 0.05, w: 0.42, h: 0.42, tilt: -3 },
        { sample: 'boulevard', shot: 'face', x: 0.44, y: 0.08, w: 0.36, h: 0.38, tilt: 2 },
        { sample: 'graffiti', shot: 'face', x: 0.72, y: 0.05, w: 0.26, h: 0.3, tilt: -2 },
        { sample: 'pier', shot: 'face', x: 0.55, y: 0.3, w: 0.28, h: 0.17, tilt: 1.5 },
        { sample: 'pier', shot: 'detail', x: 0.015, y: 0.725, w: 0.315, h: 0.19, tilt: -1 },
        { sample: 'singer', shot: 'detail', x: 0.345, y: 0.725, w: 0.31, h: 0.19, tilt: 1 },
        { sample: 'boulevard', shot: 'detail', x: 0.67, y: 0.725, w: 0.315, h: 0.19, tilt: -1 },
      ],
    },
  ];

  function layoutById(id) {
    for (var i = 0; i < LAYOUTS.length; i++) {
      if (LAYOUTS[i].id === id) return LAYOUTS[i];
    }
    return LAYOUTS[0];
  }

  // The panels of a layout in pixels, each with its sample and shot.
  function layoutPanels(layoutId, W, H) {
    var def = layoutById(layoutId);
    return def.panels.map(function (p) {
      var sample = F.sampleById(p.sample);
      return {
        sample: p.sample,
        shot: p.shot,
        role: sample ? sample.role : '',
        hero: !!p.hero,
        tilt: p.tilt || 0,
        x: p.x * W,
        y: p.y * H,
        w: p.w * W,
        h: p.h * H,
      };
    });
  }

  // Deterministic pseudo-random: same seed, same grain, so two renders of
  // one cover are byte-identical.
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

  function drawPanel(ctx, panel, img, sample, grade, index, override) {
    var px = panel.x;
    var py = panel.y;
    var pw = panel.w;
    var ph = panel.h;
    var aspect = pw / ph;
    var win = F.computeWindow(sample, aspect, panel.shot);
    if (override) {
      var zoom = override.zoom || 1;
      var zw = win.w / zoom;
      var zh = win.h / zoom;
      var cx = win.x + win.w / 2 + (override.dx || 0);
      var cy = win.y + win.h / 2 + (override.dy || 0);
      win = {
        x: Math.max(0, Math.min(1 - zw, cx - zw / 2)),
        y: Math.max(0, Math.min(1 - zh, cy - zh / 2)),
        w: zw,
        h: zh,
      };
    }
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;

    ctx.save();
    var cxp = px + pw / 2;
    var cyp = py + ph / 2;
    if (panel.tilt) {
      ctx.translate(cxp, cyp);
      ctx.rotate((panel.tilt * Math.PI) / 180);
      ctx.translate(-cxp, -cyp);
    }
    // Layered drop shadow: a dark slab behind the panel, offset down-right.
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(px + 5, py + 7, pw, ph);
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    ctx.drawImage(img, win.x * iw, win.y * ih, win.w * iw, win.h * ih, px, py, pw, ph);
    // Grade tint and a whisper of sky glow from the top.
    ctx.fillStyle = grade.tint;
    ctx.fillRect(px, py, pw, ph);
    var glow = ctx.createLinearGradient(0, py, 0, py + ph * 0.45);
    glow.addColorStop(0, grade.glow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(px, py, pw, ph * 0.45);
    // Film grain: sparse seeded dots, same on every render.
    var rnd = mulberry32(1000 + index * 77);
    var dots = Math.min(420, Math.floor((pw * ph) / 900));
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (var d = 0; d < dots; d++) {
      ctx.fillRect(px + rnd() * pw, py + rnd() * ph, 1.2, 1.2);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (var e = 0; e < dots / 2; e++) {
      ctx.fillRect(px + rnd() * pw, py + rnd() * ph, 1.2, 1.2);
    }
    // Halftone dots, faint, along the panel's bottom edge.
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    var step = Math.max(7, pw / 46);
    for (var hx = px + step / 2; hx < px + pw; hx += step) {
      ctx.beginPath();
      ctx.arc(hx, py + ph - 5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Inked frame: a dark outer line, then a gold inner line.
    ctx.save();
    if (panel.tilt) {
      ctx.translate(cxp, cyp);
      ctx.rotate((panel.tilt * Math.PI) / 180);
      ctx.translate(-cxp, -cyp);
    }
    ctx.lineWidth = Math.max(2, pw * 0.006);
    ctx.strokeStyle = '#0a0512';
    ctx.strokeRect(px - 1.5, py - 1.5, pw + 3, ph + 3);
    ctx.lineWidth = Math.max(2, pw * 0.005);
    ctx.strokeStyle = '#f2b705';
    ctx.strokeRect(px, py, pw, ph);
    ctx.restore();

    // Role tag, shrunk to fit the panel, and the hero's edition chip.
    window.NC.poster.drawRoleTag(ctx, panel.role, panel);
    if (panel.hero) {
      window.NC.poster.drawEditionChip(ctx, panel);
    }
  }

  // Renders the whole cover (photo zones + furniture) onto ctx.
  function renderCover(ctx, W, H, opts) {
    var layout = layoutById(opts.layout || 'hero');
    var grade = gradeById(opts.grade || 'sunset');
    var images = opts.images || {};

    // Plum night background with a warm glow at the top.
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1c0b28');
    bg.addColorStop(0.55, '#160a20');
    bg.addColorStop(1, '#0d0513');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    var sky = ctx.createRadialGradient(W * 0.5, -H * 0.1, 10, W * 0.5, -H * 0.1, W * 0.75);
    sky.addColorStop(0, grade.sky[0]);
    sky.addColorStop(0.6, grade.sky[1]);
    sky.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // Full-bleed layout: one photo behind everything.
    if (layout.bleed) {
      var bleedSample = F.sampleById(layout.bleed);
      var bleedImg = images[layout.bleed];
      if (bleedImg && bleedSample) {
        var win = F.computeWindow(bleedSample, W / H, 'wide');
        var iw = bleedImg.naturalWidth || bleedImg.width;
        var ih = bleedImg.naturalHeight || bleedImg.height;
        ctx.drawImage(bleedImg, win.x * iw, win.y * ih, win.w * iw, win.h * ih, 0, 0, W, H);
        ctx.fillStyle = 'rgba(13,5,19,0.45)';
        ctx.fillRect(0, 0, W, H);
      }
    }

    var panels = layoutPanels(layout.id, W, H);
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      // The editor may override a panel's photo (an upload) — then the
      // sample, image and role all come from it instead of the layout.
      var sample = (opts.panelSamples && opts.panelSamples[i]) || F.sampleById(panel.sample);
      var img = (opts.panelImages && opts.panelImages[i]) || images[panel.sample];
      if (opts.panelRoles && opts.panelRoles[i]) panel.role = opts.panelRoles[i];
      if (!sample || !img) continue;
      var override = opts.overrides ? opts.overrides[i] : null;
      drawPanel(ctx, panel, img, sample, grade, i, override);
    }

    window.NC.poster.drawFurniture(ctx, W, H, {
      title: opts.title || 'NEON COAST',
      subtitle: opts.subtitle || 'Paid in Sunsets',
      grade: grade,
      bleed: !!layout.bleed,
    });
  }

  window.NC.cover = {
    GRADES: GRADES,
    LAYOUTS: LAYOUTS,
    gradeById: gradeById,
    layoutById: layoutById,
    layoutPanels: layoutPanels,
    renderCover: renderCover,
  };
})();
