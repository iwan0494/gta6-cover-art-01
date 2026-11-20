// editor.js — logika editor Neon Coast Cover Studio.
// Panel kontrol kiri: foto contoh + upload, layout, grade, judul.
// Preview live tengah (canvas #stage). Panel bisa diklik untuk dipilih,
// lalu di-drag (pan), di-zoom (slider), atau diganti shot/fotonya.
// Undo/redo: snapshot diambil SEBELUM mutasi — drag di pointerdown,
// zoom di input pertama, tombol di klik, teks di focus. Snapshot yang
// diambil sesudah mutasi tidak bisa mengembalikan keadaan lama.

import { SAMPLE_PHOTOS, photoById, shotById, uploadCrop, dealCast } from './faces.js';
import { GRADES, LAYOUTS, layoutById, panelRects, panelCount, defaultPanels, renderCover } from './cover.js';

const EXPORT_SIZES = [
  { w: 1080, h: 1080, label: 'Square 1080x1080' },
  { w: 1080, h: 1350, label: 'Portrait 1080x1350' },
  { w: 1920, h: 1080, label: 'Wide 1920x1080' },
];

// Muat semua foto contoh jadi Map id -> HTMLImageElement.
export function loadSampleImages() {
  const jobs = SAMPLE_PHOTOS.map((p) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve([p.id, img]);
    img.onerror = () => resolve([p.id, null]);
    img.src = p.src;
  }));
  return Promise.all(jobs).then((pairs) => {
    const map = new Map();
    for (const [id, img] of pairs) if (img) map.set(id, img);
    return map;
  });
}

function cloneState(s) {
  return JSON.parse(JSON.stringify({
    layout: s.layout, grade: s.grade, title: s.title,
    subtitle: s.subtitle, panels: s.panels, selected: s.selected,
  }));
}

export function initEditor() {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const state = {
    layout: 'keyart',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'Paid in Sunsets',
    panels: defaultPanels('keyart'),
    selected: 1,
    images: new Map(),
    uploads: [],
  };
  const undoStack = [];
  const redoStack = [];
  let uploadSeq = 0;

  // --- undo / redo: snapshot SEBELUM perubahan -------------------------
  function snapshot() {
    undoStack.push(cloneState(state));
    if (undoStack.length > 50) undoStack.shift();
    redoStack.length = 0;
    syncUndoButtons();
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(cloneState(state));
    const prev = undoStack.pop();
    Object.assign(state, prev);
    state.panels = prev.panels;
    render();
    syncAll();
    syncUndoButtons();
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(cloneState(state));
    const next = redoStack.pop();
    Object.assign(state, next);
    state.panels = next.panels;
    render();
    syncAll();
    syncUndoButtons();
  }
  function syncUndoButtons() {
    const u = document.getElementById('undoBtn');
    const r = document.getElementById('redoBtn');
    if (u) u.disabled = !undoStack.length;
    if (r) r.disabled = !redoStack.length;
  }

  // --- render -----------------------------------------------------------
  function render() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    renderCover(ctx, W, H, state);
    // Garis seleksi di panel terpilih.
    const rects = panelRects(state.layout, W, H);
    const sel = rects[state.selected];
    if (sel) {
      ctx.save();
      ctx.strokeStyle = '#22e6ff';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.strokeRect(sel.x + 2, sel.y + 2, sel.w - 4, sel.h - 4);
      ctx.restore();
    }
    updatePanelInfo();
  }

  function updatePanelInfo() {
    const el = document.getElementById('panelInfo');
    if (!el) return;
    const p = state.panels[state.selected];
    if (!p) { el.textContent = 'Tidak ada panel terpilih.'; return; }
    const photo = photoById(p.photo);
    const shot = photo ? shotById(photo, p.shot) : null;
    el.textContent = `Panel ${state.selected + 1} — ${photo ? photo.label : p.photo}` +
      ` (${photo ? photo.role : ''}) · shot: ${shot ? shot.label : p.shot}` +
      ` · zoom ${p.zoom.toFixed(2)}x`;
  }

  // --- kontrol: foto ----------------------------------------------------
  function buildPhotoStrip() {
    const strip = document.getElementById('photoStrip');
    if (!strip) return;
    strip.innerHTML = '';
    for (const p of SAMPLE_PHOTOS) {
      const b = document.createElement('button');
      b.className = 'thumb';
      b.type = 'button';
      b.title = `${p.label} — ${p.role}`;
      const img = document.createElement('img');
      img.src = p.src;
      img.alt = p.label;
      b.appendChild(img);
      const cap = document.createElement('span');
      cap.textContent = p.role;
      b.appendChild(cap);
      b.addEventListener('click', () => {
        snapshot();
        const cur = state.panels[state.selected];
        if (cur) { cur.photo = p.id; cur.shot = 'face'; cur.zoom = 1; cur.dx = 0; cur.dy = 0; }
        render();
      });
      strip.appendChild(b);
    }
  }

  function bindUpload() {
    const input = document.getElementById('uploadInput');
    const btn = document.getElementById('uploadBtn');
    if (btn && input) btn.addEventListener('click', () => input.click());
    if (!input) return;
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          snapshot();
          const id = 'upload-' + (++uploadSeq);
          state.images.set(id, img);
          state.uploads.push({ id, src: reader.result, label: file.name, role: 'UPLOAD', face: null, shots: [] });
          const cur = state.panels[state.selected];
          if (cur) { cur.photo = id; cur.shot = '__upload'; cur.zoom = 1; cur.dx = 0; cur.dy = 0; }
          render();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
      input.value = '';
    });
  }

  // --- kontrol: layout + grade ------------------------------------------
  function buildPickers() {
    const lp = document.getElementById('layoutPicker');
    if (lp) {
      lp.innerHTML = '';
      for (const l of LAYOUTS) {
        const b = document.createElement('button');
        b.className = 'pick' + (l.id === state.layout ? ' active' : '');
        b.type = 'button';
        b.textContent = l.name;
        b.dataset.layout = l.id;
        b.addEventListener('click', () => {
          snapshot();
          state.layout = l.id;
          // Ganti layout = bagi ulang cast supaya tiap panel shot berbeda.
          state.panels = defaultPanels(l.id, 11 + l.id.length);
          const rects = panelRects(l.id, canvas.width, canvas.height);
          state.selected = Math.max(0, rects.findIndex((r) => r.hero));
          lp.querySelectorAll('.pick').forEach((x) => x.classList.toggle('active', x.dataset.layout === l.id));
          render();
        });
        lp.appendChild(b);
      }
    }
    const gp = document.getElementById('gradePicker');
    if (gp) {
      gp.innerHTML = '';
      for (const g of GRADES) {
        const b = document.createElement('button');
        b.className = 'swatch' + (g.id === state.grade ? ' active' : '');
        b.type = 'button';
        b.title = g.name;
        b.dataset.grade = g.id;
        b.style.background = `linear-gradient(135deg, ${g.accent} 0%, ${g.tint.replace(/[\d.]+\)$/, '0.9)')} 55%, ${g.bg} 100%)`;
        const cap = document.createElement('span');
        cap.textContent = g.name;
        b.appendChild(cap);
        b.addEventListener('click', () => {
          snapshot();
          state.grade = g.id;
          gp.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('active', x.dataset.grade === g.id));
          render();
        });
        gp.appendChild(b);
      }
    }
  }

  // --- kontrol: judul ----------------------------------------------------
  function bindTitles() {
    const t = document.getElementById('titleInput');
    const s = document.getElementById('subtitleInput');
    let armed = false;
    if (t) {
      t.value = state.title;
      t.addEventListener('focus', () => { if (!armed) { snapshot(); armed = true; } });
      t.addEventListener('blur', () => { armed = false; });
      t.addEventListener('input', () => { state.title = t.value.toUpperCase() || 'NEON COAST'; render(); });
    }
    if (s) {
      s.value = state.subtitle;
      s.addEventListener('focus', () => { if (!armed) { snapshot(); armed = true; } });
      s.addEventListener('blur', () => { armed = false; });
      s.addEventListener('input', () => { state.subtitle = s.value || 'Paid in Sunsets'; render(); });
    }
  }

  // --- kontrol: panel terpilih (shot / foto / acak) ----------------------
  function bindPanelButtons() {
    const shotBtn = document.getElementById('shotBtn');
    if (shotBtn) shotBtn.addEventListener('click', () => {
      const cur = state.panels[state.selected];
      const photo = cur && photoById(cur.photo);
      if (!cur || !photo || !photo.shots.length) return;
      snapshot();
      const idx = photo.shots.findIndex((s) => s.id === cur.shot);
      cur.shot = photo.shots[(idx + 1) % photo.shots.length].id;
      cur.zoom = 1; cur.dx = 0; cur.dy = 0;
      render();
    });
    const photoBtn = document.getElementById('photoBtn');
    if (photoBtn) photoBtn.addEventListener('click', () => {
      const cur = state.panels[state.selected];
      if (!cur) return;
      snapshot();
      const idx = SAMPLE_PHOTOS.findIndex((p) => p.id === cur.photo);
      const next = SAMPLE_PHOTOS[(idx + 1) % SAMPLE_PHOTOS.length];
      cur.photo = next.id;
      cur.shot = 'face';
      cur.zoom = 1; cur.dx = 0; cur.dy = 0;
      render();
    });
    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
      snapshot();
      const seed = Math.floor(Math.random() * 100000);
      state.panels = defaultPanels(state.layout, seed);
      render();
    });
  }

  // --- zoom slider: snapshot di input pertama ----------------------------
  function bindZoom() {
    const z = document.getElementById('zoomSlider');
    if (!z) return;
    let armed = false;
    const arm = () => { if (!armed) { snapshot(); armed = true; } };
    z.addEventListener('pointerdown', arm);
    z.addEventListener('focus', arm);
    z.addEventListener('input', () => {
      arm();
      const cur = state.panels[state.selected];
      if (cur) cur.zoom = parseFloat(z.value) || 1;
      render();
    });
    z.addEventListener('change', () => { armed = false; });
  }

  // --- klik + drag di kanvas ---------------------------------------------
  function bindCanvas() {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height),
      };
    };
    canvas.addEventListener('pointerdown', (e) => {
      const pos = toLocal(e);
      const rects = panelRects(state.layout, canvas.width, canvas.height);
      const hit = rects.findIndex((r) => pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h);
      if (hit < 0) return;
      snapshot(); // <-- SEBELUM drag mengubah dx/dy.
      state.selected = hit;
      dragging = true;
      lastX = pos.x;
      lastY = pos.y;
      canvas.setPointerCapture(e.pointerId);
      render();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const pos = toLocal(e);
      const cur = state.panels[state.selected];
      const rect = panelRects(state.layout, canvas.width, canvas.height)[state.selected];
      if (cur && rect) {
        cur.dx += ((pos.x - lastX) / rect.w) * 0.6;
        cur.dy += ((pos.y - lastY) / rect.h) * 0.6;
        lastX = pos.x;
        lastY = pos.y;
        render();
      }
    });
    const endDrag = () => { dragging = false; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
  }

  // --- ekspor 3 PNG -------------------------------------------------------
  function renderExportSize(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    renderCover(c.getContext('2d'), w, h, state);
    return c;
  }
  async function exportPNGs() {
    for (const s of EXPORT_SIZES) {
      const c = renderExportSize(s.w, s.h);
      await new Promise((resolve) => {
        c.toBlob((blob) => {
          if (!blob) { resolve(); return; }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `neon-coast-${s.w}x${s.h}.png`;
          a.click();
          setTimeout(() => { URL.revokeObjectURL(a.href); resolve(); }, 300);
        }, 'image/png');
      });
    }
  }

  // --- tombol header ------------------------------------------------------
  function bindHeader() {
    const u = document.getElementById('undoBtn');
    const r = document.getElementById('redoBtn');
    const x = document.getElementById('exportBtn');
    if (u) u.addEventListener('click', undo);
    if (r) r.addEventListener('click', redo);
    if (x) x.addEventListener('click', exportPNGs);
  }

  function syncAll() {
    const t = document.getElementById('titleInput');
    const s = document.getElementById('subtitleInput');
    if (t) t.value = state.title;
    if (s) s.value = state.subtitle;
    const lp = document.getElementById('layoutPicker');
    if (lp) lp.querySelectorAll('.pick').forEach((el) => el.classList.toggle('active', el.dataset.layout === state.layout));
    const gp = document.getElementById('gradePicker');
    if (gp) gp.querySelectorAll('.swatch').forEach((el) => el.classList.toggle('active', el.dataset.grade === state.grade));
  }

  buildPhotoStrip();
  buildPickers();
  bindTitles();
  bindPanelButtons();
  bindZoom();
  bindCanvas();
  bindUpload();
  bindHeader();
  syncUndoButtons();

  const api = {
    state,
    render,
    undo,
    redo,
    exportPNGs,
    renderExportSize,
    EXPORT_SIZES,
    loadImages: () => loadSampleImages().then((m) => { state.images = m; render(); return m; }),
  };
  window.NeonCoast = api;
  return loadSampleImages().then((m) => {
    state.images = m;
    render();
    return api;
  });
}
