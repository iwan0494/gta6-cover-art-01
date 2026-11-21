// Neon Coast Cover Studio — the editor.
//
// The editor holds the cover state (layout, grade, title, which photo sits
// in which panel, and each panel's crop) and renders it live onto the
// preview canvas. Panel crops are edited by dragging on the canvas itself;
// every mutation is snapshotted first so undo and redo always work.

(function () {
  'use strict';

  var F = window.NC.faces;
  var C = window.NC.cover;

  var PREVIEW_W = 1280;
  var PREVIEW_H = 720;
  var EXPORT_SIZES = [
    { w: 1080, h: 1080, name: 'neon-coast-1080x1080.png' },
    { w: 1080, h: 1350, name: 'neon-coast-1080x1350.png' },
    { w: 1920, h: 1080, name: 'neon-coast-1920x1080.png' },
  ];

  var state = {
    layout: 'hero',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'Paid in Sunsets',
    assignments: [],
    overrides: {},
    selected: 0,
  };
  var photos = [];
  var undoStack = [];
  var redoStack = [];
  var canvas = null;
  var ctx = null;
  var uploadCount = 0;

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error('cannot load ' + src));
      };
      img.src = src;
    });
  }

  // A pseudo-sample for a photo the user uploads: no measured face, so
  // its crops come from the upper-third default.
  function uploadSample(photo) {
    return {
      id: photo.id,
      src: photo.name,
      role: 'UPLOAD',
      face: { x: 0.3, y: 0.06, w: 0.4, h: 0.28 },
      shots: {
        face: { x: 0.08, y: 0.0, w: 0.84, h: 0.62 },
        wide: { x: 0.0, y: 0.0, w: 1.0, h: 0.85 },
        detail: { x: 0.0, y: 0.55, w: 1.0, h: 0.45 },
      },
    };
  }

  function photoById(id) {
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].id === id) return photos[i];
    }
    return null;
  }

  function defaultAssignments(layoutId) {
    var panels = C.layoutPanels(layoutId, PREVIEW_W, PREVIEW_H);
    return panels.map(function (p) {
      return { photoId: p.sample, shot: p.shot };
    });
  }

  function snapshot() {
    return JSON.stringify({
      layout: state.layout,
      grade: state.grade,
      title: state.title,
      subtitle: state.subtitle,
      assignments: state.assignments,
      overrides: state.overrides,
      selected: state.selected,
    });
  }

  function restore(json) {
    var s = JSON.parse(json);
    state.layout = s.layout;
    state.grade = s.grade;
    state.title = s.title;
    state.subtitle = s.subtitle;
    state.assignments = s.assignments;
    state.overrides = s.overrides;
    state.selected = s.selected;
  }

  function mutate(fn) {
    undoStack.push(snapshot());
    if (undoStack.length > 60) undoStack.shift();
    redoStack.length = 0;
    fn();
    syncControls();
    render();
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
    syncControls();
    render();
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
    syncControls();
    render();
  }

  // The images and samples for the current panels, in panel order.
  function panelAssets() {
    var panels = C.layoutPanels(state.layout, PREVIEW_W, PREVIEW_H);
    var images = [];
    var samples = [];
    var roles = [];
    for (var i = 0; i < panels.length; i++) {
      var a = state.assignments[i] || { photoId: panels[i].sample, shot: panels[i].shot };
      var photo = photoById(a.photoId);
      if (photo) {
        images.push(photo.img);
        samples.push(photo.sample || F.sampleById(photo.id));
        roles.push(photo.role);
      } else {
        images.push(null);
        samples.push(F.sampleById(panels[i].sample));
        roles.push(panels[i].role);
      }
    }
    return { images: images, samples: samples, roles: roles };
  }

  function render() {
    if (!canvas || !ctx) return;
    var assets = panelAssets();
    C.renderCover(ctx, PREVIEW_W, PREVIEW_H, {
      layout: state.layout,
      grade: state.grade,
      title: state.title,
      subtitle: state.subtitle,
      images: {},
      panelImages: assets.images,
      panelSamples: assets.samples,
      panelRoles: assets.roles,
      overrides: state.overrides,
    });
    window.__shotReady = true;
  }

  function renderTo(canvasEl, W, H) {
    var c = canvasEl.getContext('2d');
    var assets = panelAssets();
    C.renderCover(c, W, H, {
      layout: state.layout,
      grade: state.grade,
      title: state.title,
      subtitle: state.subtitle,
      images: {},
      panelImages: assets.images,
      panelSamples: assets.samples,
      panelRoles: assets.roles,
      overrides: state.overrides,
    });
  }

  function exportAll() {
    EXPORT_SIZES.forEach(function (size, i) {
      setTimeout(function () {
        var off = document.createElement('canvas');
        off.width = size.w;
        off.height = size.h;
        renderTo(off, size.w, size.h);
        off.toBlob(function (blob) {
          if (!blob) return;
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = size.name;
          document.body.appendChild(a);
          a.click();
          setTimeout(function () {
            URL.revokeObjectURL(a.href);
            a.remove();
          }, 2000);
        }, 'image/png');
      }, i * 450);
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function buildRail() {
    var rail = document.getElementById('rail');
    if (!rail) return;
    rail.innerHTML = '';

    var layoutSec = el('section', 'rail-sec');
    layoutSec.appendChild(el('h2', '', 'Layout'));
    var layoutGrid = el('div', 'layout-grid');
    C.LAYOUTS.forEach(function (l) {
      var b = el('button', 'layout-btn' + (state.layout === l.id ? ' active' : ''), l.name);
      b.type = 'button';
      b.dataset.layout = l.id;
      b.addEventListener('click', function () {
        mutate(function () {
          state.layout = l.id;
          state.assignments = defaultAssignments(l.id);
          state.overrides = {};
          state.selected = 0;
        });
      });
      layoutGrid.appendChild(b);
    });
    layoutSec.appendChild(layoutGrid);
    rail.appendChild(layoutSec);

    var gradeSec = el('section', 'rail-sec');
    gradeSec.appendChild(el('h2', '', 'Grade'));
    var gradeRow = el('div', 'grade-row');
    C.GRADES.forEach(function (g) {
      var b = el('button', 'grade-btn' + (state.grade === g.id ? ' active' : ''));
      b.type = 'button';
      b.title = g.name;
      b.dataset.grade = g.id;
      b.style.background = 'linear-gradient(135deg,' + g.sky[0] + ',' + g.sky[1] + ')';
      b.setAttribute('aria-label', g.name);
      b.addEventListener('click', function () {
        mutate(function () {
          state.grade = g.id;
        });
      });
      gradeRow.appendChild(b);
    });
    gradeSec.appendChild(gradeRow);
    rail.appendChild(gradeSec);

    var textSec = el('section', 'rail-sec');
    textSec.appendChild(el('h2', '', 'Title'));
    var titleInput = el('input', 'text-input');
    titleInput.id = 'title-input';
    titleInput.type = 'text';
    titleInput.value = state.title;
    titleInput.maxLength = 24;
    titleInput.addEventListener('input', function () {
      mutate(function () {
        state.title = titleInput.value.toUpperCase() || 'NEON COAST';
      });
    });
    textSec.appendChild(titleInput);
    var subInput = el('input', 'text-input');
    subInput.id = 'subtitle-input';
    subInput.type = 'text';
    subInput.value = state.subtitle;
    subInput.maxLength = 40;
    subInput.addEventListener('input', function () {
      mutate(function () {
        state.subtitle = subInput.value || 'Paid in Sunsets';
      });
    });
    textSec.appendChild(subInput);
    rail.appendChild(textSec);

    var photoSec = el('section', 'rail-sec');
    photoSec.appendChild(el('h2', '', 'Photos'));
    var photoRow = el('div', 'photo-row');
    photos.forEach(function (p) {
      var b = el('button', 'photo-btn');
      b.type = 'button';
      b.title = p.role;
      var thumb = document.createElement('img');
      thumb.src = p.thumb || p.img.src;
      thumb.alt = p.role;
      b.appendChild(thumb);
      b.appendChild(el('span', '', p.role));
      b.addEventListener('click', function () {
        mutate(function () {
          var a = state.assignments[state.selected];
          if (a) {
            a.photoId = p.id;
            a.shot = 'face';
          }
        });
      });
      photoRow.appendChild(b);
    });
    photoSec.appendChild(photoRow);
    var uploadLabel = el('label', 'upload-btn', 'Upload your photo');
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.hidden = true;
    fileInput.addEventListener('change', function () {
      var files = Array.prototype.slice.call(fileInput.files || []);
      if (files.length === 0) return;
      var loaders = files.map(function (file) {
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () {
            loadImage(reader.result).then(function (img) {
              uploadCount++;
              var photo = {
                id: 'up' + uploadCount,
                name: file.name,
                img: img,
                role: 'UPLOAD ' + uploadCount,
                sample: null,
              };
              photo.sample = uploadSample(photo);
              photos.push(photo);
              resolve(photo);
            });
          };
          reader.readAsDataURL(file);
        });
      });
      Promise.all(loaders).then(function () {
        mutate(function () {});
        buildRail();
      });
    });
    uploadLabel.appendChild(fileInput);
    photoSec.appendChild(uploadLabel);
    rail.appendChild(photoSec);

    var panelSec = el('section', 'rail-sec');
    panelSec.appendChild(el('h2', '', 'Selected panel'));
    var shotBtn = el('button', 'action-btn', 'Cycle shot');
    shotBtn.type = 'button';
    shotBtn.addEventListener('click', function () {
      mutate(function () {
        var a = state.assignments[state.selected];
        if (!a) return;
        var photo = photoById(a.photoId);
        var sample = photo ? photo.sample || F.sampleById(photo.id) : null;
        if (!sample) return;
        var names = Object.keys(sample.shots);
        var idx = names.indexOf(a.shot);
        a.shot = names[(idx + 1) % names.length];
      });
    });
    panelSec.appendChild(shotBtn);
    var zoomRow = el('div', 'zoom-row');
    var zoomOut = el('button', 'action-btn', 'Zoom out');
    zoomOut.type = 'button';
    zoomOut.addEventListener('click', function () {
      mutate(function () {
        var o = state.overrides[state.selected] || { zoom: 1, dx: 0, dy: 0 };
        o.zoom = Math.max(1, (o.zoom || 1) - 0.2);
        state.overrides[state.selected] = o;
      });
    });
    var zoomIn = el('button', 'action-btn', 'Zoom in');
    zoomIn.type = 'button';
    zoomIn.addEventListener('click', function () {
      mutate(function () {
        var o = state.overrides[state.selected] || { zoom: 1, dx: 0, dy: 0 };
        o.zoom = Math.min(3, (o.zoom || 1) + 0.2);
        state.overrides[state.selected] = o;
      });
    });
    var resetCrop = el('button', 'action-btn', 'Reset crop');
    resetCrop.type = 'button';
    resetCrop.addEventListener('click', function () {
      mutate(function () {
        delete state.overrides[state.selected];
      });
    });
    zoomRow.appendChild(zoomOut);
    zoomRow.appendChild(zoomIn);
    zoomRow.appendChild(resetCrop);
    panelSec.appendChild(zoomRow);
    rail.appendChild(panelSec);

    var actionSec = el('section', 'rail-sec');
    var undoBtn = el('button', 'action-btn', 'Undo');
    undoBtn.type = 'button';
    undoBtn.addEventListener('click', undo);
    var redoBtn = el('button', 'action-btn', 'Redo');
    redoBtn.type = 'button';
    redoBtn.addEventListener('click', redo);
    var exportBtn = el('button', 'export-btn', 'Export 3 PNGs');
    exportBtn.type = 'button';
    exportBtn.addEventListener('click', exportAll);
    actionSec.appendChild(undoBtn);
    actionSec.appendChild(redoBtn);
    actionSec.appendChild(exportBtn);
    rail.appendChild(actionSec);
  }

  function syncControls() {
    buildRail();
    var titleInput = document.getElementById('title-input');
    if (titleInput) titleInput.value = state.title;
    var subInput = document.getElementById('subtitle-input');
    if (subInput) subInput.value = state.subtitle;
  }

  function panelAt(mx, my) {
    var panels = C.layoutPanels(state.layout, PREVIEW_W, PREVIEW_H);
    for (var i = panels.length - 1; i >= 0; i--) {
      var p = panels[i];
      if (mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h) return i;
    }
    return -1;
  }

  function bindCanvas() {
    var dragging = false;
    var lastX = 0;
    var lastY = 0;
    canvas.addEventListener('pointerdown', function (e) {
      var rect = canvas.getBoundingClientRect();
      var mx = ((e.clientX - rect.left) / rect.width) * PREVIEW_W;
      var my = ((e.clientY - rect.top) / rect.height) * PREVIEW_H;
      var idx = panelAt(mx, my);
      if (idx >= 0) {
        state.selected = idx;
        dragging = true;
        lastX = mx;
        lastY = my;
        canvas.setPointerCapture(e.pointerId);
        render();
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var rect = canvas.getBoundingClientRect();
      var mx = ((e.clientX - rect.left) / rect.width) * PREVIEW_W;
      var my = ((e.clientY - rect.top) / rect.height) * PREVIEW_H;
      var dx = (mx - lastX) / PREVIEW_W;
      var dy = (my - lastY) / PREVIEW_H;
      lastX = mx;
      lastY = my;
      var o = state.overrides[state.selected] || { zoom: 1, dx: 0, dy: 0 };
      o.dx = (o.dx || 0) - dx;
      o.dy = (o.dy || 0) - dy;
      state.overrides[state.selected] = o;
      render();
    });
    canvas.addEventListener('pointerup', function () {
      if (dragging) {
        dragging = false;
        undoStack.push(snapshot());
      }
    });
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var idx = state.selected;
      var o = state.overrides[idx] || { zoom: 1, dx: 0, dy: 0 };
      o.zoom = Math.max(1, Math.min(3, (o.zoom || 1) - Math.sign(e.deltaY) * 0.15));
      state.overrides[idx] = o;
      render();
    }, { passive: false });
  }

  function init() {
    canvas = document.getElementById('stage');
    if (!canvas) return Promise.resolve();
    ctx = canvas.getContext('2d');
    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;
    var loaders = F.SAMPLES.map(function (s) {
      return loadImage(s.src).then(function (img) {
        photos.push({ id: s.id, name: s.src, img: img, role: s.role, sample: s });
      });
    });
    return Promise.all(loaders)
      .then(function () {
        state.assignments = defaultAssignments(state.layout);
        buildRail();
        bindCanvas();
        if (document.fonts && document.fonts.load) {
          return Promise.all([
            document.fonts.load('16px Anton'),
            document.fonts.load('16px Pacifico'),
            document.fonts.ready,
          ]).catch(function () {});
        }
      })
      .then(function () {
        render();
      });
  }

  window.NC.editor = {
    init: init,
    render: render,
    renderTo: renderTo,
    exportAll: exportAll,
    undo: undo,
    redo: redo,
    state: state,
    photos: photos,
  };
})();
