// faces.js — sample cast, face boxes and per-photo shots (all fractions of the image).
// Face boxes were measured by looking at each sample photo. A "shot" is a crop rect;
// whether a shot shows a face is computed from the face box, never hand-flagged.

export const SAMPLES = [
  {
    id: "boulevard", src: "samples/boulevard.jpg", role: "THE DRIVER",
    face: { x: 0.28, y: 0.04, w: 0.22, h: 0.24 },
    shots: [
      { id: "face", label: "Close-up wajah", crop: { x: 0.20, y: 0.00, w: 0.42, h: 0.34 } },
      { id: "figure", label: "Figur + mobil", crop: { x: 0.05, y: 0.00, w: 0.95, h: 0.75 } },
      { id: "car", label: "Detail mobil merah", crop: { x: 0.00, y: 0.55, w: 0.55, h: 0.45 } },
      { id: "palms", label: "Langit + palem", crop: { x: 0.00, y: 0.00, w: 1.00, h: 0.30 } },
      { id: "jeans", label: "Detail jeans + mobil", crop: { x: 0.45, y: 0.55, w: 0.55, h: 0.45 } },
    ],
  },
  {
    id: "pier", src: "samples/pier.jpg", role: "THE CAPTAIN",
    face: { x: 0.22, y: 0.10, w: 0.26, h: 0.28 },
    shots: [
      { id: "face", label: "Close-up wajah", crop: { x: 0.12, y: 0.02, w: 0.48, h: 0.42 } },
      { id: "figure", label: "Figur + pancing", crop: { x: 0.00, y: 0.00, w: 0.75, h: 0.85 } },
      { id: "rod", label: "Tangan + reel", crop: { x: 0.45, y: 0.45, w: 0.55, h: 0.55 } },
      { id: "sea", label: "Laut + horizon", crop: { x: 0.35, y: 0.30, w: 0.65, h: 0.45 } },
      { id: "hat", label: "Topi + langit", crop: { x: 0.15, y: 0.00, w: 0.45, h: 0.22 } },
    ],
  },
  {
    id: "graffiti", src: "samples/graffiti.jpg", role: "THE ARTIST",
    face: { x: 0.15, y: 0.06, w: 0.30, h: 0.52 },
    shots: [
      { id: "face", label: "Wajah mural", crop: { x: 0.08, y: 0.02, w: 0.42, h: 0.62 } },
      { id: "mural", label: "Mural penuh", crop: { x: 0.00, y: 0.00, w: 1.00, h: 1.00 } },
      { id: "hand", label: "Tangan + hijau", crop: { x: 0.02, y: 0.55, w: 0.45, h: 0.45 } },
      { id: "wall", label: "Dinding oranye", crop: { x: 0.55, y: 0.15, w: 0.45, h: 0.55 } },
    ],
  },
  {
    id: "portrait", src: "samples/portrait.jpg", role: "THE LOOKOUT",
    face: { x: 0.20, y: 0.25, w: 0.65, h: 0.55 },
    shots: [
      { id: "face", label: "Close-up wajah", crop: { x: 0.12, y: 0.15, w: 0.80, h: 0.70 } },
      { id: "close", label: "Wajah ketat", crop: { x: 0.18, y: 0.22, w: 0.60, h: 0.55 } },
      { id: "smile", label: "Senyum", crop: { x: 0.20, y: 0.30, w: 0.55, h: 0.45 } },
      { id: "hair", label: "Kepang", crop: { x: 0.00, y: 0.60, w: 0.70, h: 0.40 } },
    ],
  },
  {
    id: "singer", src: "samples/singer.jpg", role: "THE SINGER",
    face: { x: 0.30, y: 0.20, w: 0.20, h: 0.30 },
    shots: [
      { id: "face", label: "Close-up wajah", crop: { x: 0.22, y: 0.10, w: 0.38, h: 0.45 } },
      { id: "stage", label: "Panggung penuh", crop: { x: 0.15, y: 0.05, w: 0.70, h: 0.75 } },
      { id: "guitar", label: "Gitar", crop: { x: 0.45, y: 0.65, w: 0.55, h: 0.35 } },
      { id: "mic", label: "Mikrofon", crop: { x: 0.38, y: 0.18, w: 0.25, h: 0.25 } },
    ],
  },
];

export function sampleById(id) {
  return SAMPLES.find((s) => s.id === id) || SAMPLES[0];
}

// Does this shot's crop contain the face centre? (face-aware guard input)
export function shotShowsFace(photo, shot) {
  const cx = photo.face.x + photo.face.w / 2;
  const cy = photo.face.y + photo.face.h / 2;
  return cx >= shot.crop.x && cx <= shot.crop.x + shot.crop.w &&
    cy >= shot.crop.y && cy <= shot.crop.y + shot.crop.h;
}

// Fit a crop rect to a target aspect (w/h), keeping its centre, clamped to [0,1].
export function fitToAspect(crop, aspect) {
  let { x, y, w, h } = crop;
  const cx = x + w / 2, cy = y + h / 2;
  if (w / h > aspect) { w = h * aspect; } else { h = w / aspect; }
  x = Math.min(Math.max(cx - w / 2, 0), 1 - w);
  y = Math.min(Math.max(cy - h / 2, 0), 1 - h);
  return { x, y, w, h };
}

// Crop around the face with padding, fitted to the target aspect, never cutting the face.
export function faceSafeCrop(photo, aspect, pad = 0.35) {
  const f = photo.face;
  let crop = {
    x: Math.max(0, f.x - f.w * pad),
    y: Math.max(0, f.y - f.h * pad),
    w: Math.min(1, f.w * (1 + pad * 2)),
    h: Math.min(1, f.h * (1 + pad * 2)),
  };
  // keep the whole face inside after the aspect fit
  const fitted = fitToAspect(crop, aspect);
  const fx0 = f.x, fx1 = f.x + f.w, fy0 = f.y, fy1 = f.y + f.h;
  if (fitted.x > fx0 || fitted.x + fitted.w < fx1 || fitted.y > fy0 || fitted.y + fitted.h < fy1) {
    // fall back: widen the crop until the face fits
    const needW = Math.max(fitted.w, fx1 - fitted.x);
    const needH = Math.max(fitted.h, fy1 - fitted.y);
    return { x: Math.max(0, Math.min(fitted.x, fx0)), y: Math.max(0, Math.min(fitted.y, fy0)), w: Math.min(1, needW), h: Math.min(1, needH) };
  }
  return fitted;
}

// Default crop for a user-uploaded photo: bias to the upper third (faces live there).
export function defaultUploadCrop(aspect) {
  return fitToAspect({ x: 0.08, y: 0.0, w: 0.84, h: 0.62 }, aspect);
}
