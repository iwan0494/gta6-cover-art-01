// Neon Coast Cover Studio — sample photos and face-safe crops.
//
// Every sample photo carries a measured face box (fractions of the photo)
// plus a few "shots": different crop rectangles of the same photo. A face
// shot always keeps its face whole; a detail shot is a faceless part of
// the photo (a car, a guitar, an arch) so the same person can appear twice
// on one cover only through a detail, never twice as a face.
//
// Face boxes were measured by looking at the five photos:
//   boulevard  544x720   the driver, sunglasses, sunset boulevard
//   pier       720x720   the captain, bucket hat, fishing rod
//   graffiti   1280x1868 the artist, a painted face on a brick wall
//   portrait   1280x1918 the lookout, curly hair, smiling on a sofa
//   singer     1280x1917 the singer, guitar, blue stage light

(function () {
  'use strict';

  var SAMPLES = [
    {
      id: 'boulevard',
      src: 'samples/boulevard.jpg',
      role: 'THE DRIVER',
      face: { x: 0.28, y: 0.05, w: 0.26, h: 0.2 },
      core: { x: 0.32, y: 0.08, w: 0.18, h: 0.14 },
      shots: {
        face: { x: 0.16, y: 0.0, w: 0.52, h: 0.42 },
        wide: { x: 0.05, y: 0.0, w: 0.9, h: 0.75 },
        detail: { x: 0.0, y: 0.55, w: 0.55, h: 0.45 },
        sunset: { x: 0.0, y: 0.0, w: 0.42, h: 0.4 },
      },
    },
    {
      id: 'pier',
      src: 'samples/pier.jpg',
      role: 'THE CAPTAIN',
      face: { x: 0.18, y: 0.08, w: 0.28, h: 0.3 },
      core: { x: 0.23, y: 0.14, w: 0.19, h: 0.18 },
      shots: {
        face: { x: 0.06, y: 0.0, w: 0.55, h: 0.55 },
        wide: { x: 0.05, y: 0.0, w: 0.9, h: 0.8 },
        detail: { x: 0.5, y: 0.0, w: 0.5, h: 0.7 },
      },
    },
    {
      id: 'graffiti',
      src: 'samples/graffiti.jpg',
      role: 'THE ARTIST',
      face: { x: 0.2, y: 0.15, w: 0.5, h: 0.28 },
      core: { x: 0.28, y: 0.21, w: 0.32, h: 0.16 },
      shots: {
        face: { x: 0.08, y: 0.06, w: 0.78, h: 0.5 },
        wide: { x: 0.05, y: 0.08, w: 0.9, h: 0.75 },
        detail: { x: 0.05, y: 0.55, w: 0.9, h: 0.45 },
      },
    },
    {
      id: 'portrait',
      src: 'samples/portrait.jpg',
      role: 'THE LOOKOUT',
      face: { x: 0.06, y: 0.05, w: 0.52, h: 0.3 },
      core: { x: 0.15, y: 0.1, w: 0.34, h: 0.21 },
      shots: {
        face: { x: 0.0, y: 0.0, w: 0.72, h: 0.52 },
        wide: { x: 0.0, y: 0.0, w: 1.0, h: 0.7 },
        detail: { x: 0.0, y: 0.55, w: 1.0, h: 0.45 },
      },
    },
    {
      id: 'singer',
      src: 'samples/singer.jpg',
      role: 'THE SINGER',
      face: { x: 0.36, y: 0.08, w: 0.38, h: 0.28 },
      core: { x: 0.45, y: 0.12, w: 0.19, h: 0.21 },
      shots: {
        face: { x: 0.22, y: 0.0, w: 0.66, h: 0.5 },
        wide: { x: 0.05, y: 0.02, w: 0.9, h: 0.75 },
        detail: { x: 0.0, y: 0.5, w: 0.6, h: 0.5 },
      },
    },
  ];

  function sampleById(id) {
    for (var i = 0; i < SAMPLES.length; i++) {
      if (SAMPLES[i].id === id) return SAMPLES[i];
    }
    return null;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // A crop rectangle of the given aspect that fully contains the shot's
  // base rectangle. The window only ever grows from the base rect, never
  // shrinks, so a face shot's face (with its margin baked into the base
  // rect) can never be cut by the window itself.
  function fitAspect(rect, aspect) {
    var cx = rect.x + rect.w / 2;
    var cy = rect.y + rect.h / 2;
    var w = rect.w;
    var h = rect.h;
    if (w / h < aspect) {
      w = h * aspect;
      if (w > 1) {
        w = 1;
        h = 1 / aspect;
      }
    } else {
      h = w / aspect;
      if (h > 1) {
        h = 1;
        w = aspect;
      }
    }
    var x = clamp(cx - w / 2, 0, 1 - w);
    var y = clamp(cy - h / 2, 0, 1 - h);
    return { x: x, y: y, w: w, h: h };
  }

  // The source rectangle to draw for one panel: the named shot of the
  // sample, reshaped to the panel's aspect without ever cutting the face.
  // After fitting, the window is nudged so the face's core (eyes to chin,
  // the part that must read as a face) plus a small pad sits fully inside
  // it. Hair may touch the frame in a very narrow panel; the features
  // never do. Detail shots are faceless by design and need no nudge.
  function computeWindow(sample, aspect, shotName) {
    var base = sample.shots[shotName] || sample.shots.face;
    var win = fitAspect(base, aspect);
    if (shotName !== 'detail' && shotName !== 'sunset') {
      var pad = 0.01;
      var f = sample.core || sample.face;
      if (f.x - pad < win.x) win.x = Math.max(0, f.x - pad);
      if (f.x + f.w + pad > win.x + win.w) {
        win.x = Math.min(1 - win.w, f.x + f.w + pad - win.w);
      }
      if (f.y - pad < win.y) win.y = Math.max(0, f.y - pad);
      if (f.y + f.h + pad > win.y + win.h) {
        win.y = Math.min(1 - win.h, f.y + f.h + pad - win.h);
      }
    }
    return win;
  }

  // True when the face (plus a small pad) lies fully inside the window.
  function faceInside(win, face, pad) {
    pad = pad === undefined ? 0.015 : pad;
    return (
      face.x - pad >= win.x - 1e-9 &&
      face.y - pad >= win.y - 1e-9 &&
      face.x + face.w + pad <= win.x + win.w + 1e-9 &&
      face.y + face.h + pad <= win.y + win.h + 1e-9
    );
  }

  // A first crop for a photo the user uploads: biased to the upper third,
  // where a face usually sits, and never wider than the photo.
  function defaultUploadRect(aspect) {
    var h = 0.72;
    var w = h * aspect;
    if (w > 1) {
      w = 1;
      h = 1 / aspect;
    }
    return { x: (1 - w) / 2, y: 0.06, w: w, h: h };
  }

  window.NC = window.NC || {};
  window.NC.faces = {
    SAMPLES: SAMPLES,
    sampleById: sampleById,
    computeWindow: computeWindow,
    faceInside: faceInside,
    defaultUploadRect: defaultUploadRect,
  };
})();
