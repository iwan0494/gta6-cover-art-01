// faces.js — measured face boxes and per-photo shot lists for the five
// sample photos of Neon Coast Cover Studio. Every box is a fraction of the
// photo (0..1), measured by looking at the photo itself. A "shot" is one
// crop rectangle of a photo; face shots always contain the whole face box
// with a margin, detail shots never contain a face, so a face can never be
// repeated or cut at the neck or at a panel edge in any layout.

export const SAMPLES = [
  {
    id: 'boulevard',
    src: 'samples/boulevard.jpg',
    label: 'The Driver',
    role: 'THE DRIVER',
    // Woman in sunglasses leaning on a red convertible, boulevard at sunset.
    face: { x: 0.27, y: 0.02, w: 0.33, h: 0.25 },
    shots: [
      { id: 'face', label: 'Face', rect: { x: 0.2, y: 0.0, w: 0.5, h: 0.34 }, hasFace: true },
      { id: 'figure', label: 'Figure + car', rect: { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, hasFace: true },
      { id: 'car', label: 'Red car detail', rect: { x: 0.0, y: 0.52, w: 0.5, h: 0.48 }, hasFace: false },
      { id: 'palms', label: 'Palm street', rect: { x: 0.0, y: 0.0, w: 0.42, h: 0.3 }, hasFace: false },
    ],
  },
  {
    id: 'pier',
    src: 'samples/pier.jpg',
    label: 'The Captain',
    role: 'THE CAPTAIN',
    // Older man in a bucket hat holding a fishing rod on a wooden pier.
    face: { x: 0.17, y: 0.05, w: 0.44, h: 0.31 },
    shots: [
      { id: 'face', label: 'Face', rect: { x: 0.08, y: 0.0, w: 0.62, h: 0.44 }, hasFace: true },
      { id: 'figure', label: 'Figure + rod', rect: { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, hasFace: true },
      { id: 'reel', label: 'Rod + reel', rect: { x: 0.52, y: 0.42, w: 0.48, h: 0.5 }, hasFace: false },
      { id: 'sea', label: 'Turquoise sea', rect: { x: 0.5, y: 0.24, w: 0.5, h: 0.34 }, hasFace: false },
    ],
  },
  {
    id: 'graffiti',
    src: 'samples/graffiti.jpg',
    label: 'The Artist',
    role: 'THE ARTIST',
    // Painted portrait on a brick wall: a woman's face above a blue arch.
    face: { x: 0.17, y: 0.14, w: 0.44, h: 0.31 },
    shots: [
      { id: 'face', label: 'Painted face', rect: { x: 0.1, y: 0.08, w: 0.6, h: 0.44 }, hasFace: true },
      { id: 'mural', label: 'Whole mural', rect: { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, hasFace: true },
      { id: 'arch', label: 'Arch + tree', rect: { x: 0.24, y: 0.5, w: 0.52, h: 0.46 }, hasFace: false },
      { id: 'brick', label: 'Brick wall', rect: { x: 0.6, y: 0.0, w: 0.4, h: 0.3 }, hasFace: false },
    ],
  },
  {
    id: 'portrait',
    src: 'samples/portrait.jpg',
    label: 'The Lookout',
    role: 'THE LOOKOUT',
    // Smiling senior woman with curly blonde hair, chin on her hand.
    face: { x: 0.07, y: 0.03, w: 0.54, h: 0.33 },
    shots: [
      { id: 'face', label: 'Face close-up', rect: { x: 0.0, y: 0.0, w: 0.68, h: 0.46 }, hasFace: true },
      { id: 'figure', label: 'Seated portrait', rect: { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, hasFace: true },
      { id: 'knit', label: 'Knit sweater', rect: { x: 0.3, y: 0.38, w: 0.6, h: 0.4 }, hasFace: false },
      { id: 'palm', label: 'Palm sofa', rect: { x: 0.55, y: 0.08, w: 0.45, h: 0.3 }, hasFace: false },
    ],
  },
  {
    id: 'singer',
    src: 'samples/singer.jpg',
    label: 'The Singer',
    role: 'THE SINGER',
    // Musician with curly hair playing an acoustic guitar on a blue stage.
    face: { x: 0.44, y: 0.07, w: 0.42, h: 0.29 },
    shots: [
      { id: 'face', label: 'Face + guitar', rect: { x: 0.36, y: 0.0, w: 0.6, h: 0.42 }, hasFace: true },
      { id: 'stage', label: 'On stage', rect: { x: 0.0, y: 0.0, w: 1.0, h: 1.0 }, hasFace: true },
      { id: 'guitar', label: 'Guitar body', rect: { x: 0.0, y: 0.42, w: 0.55, h: 0.5 }, hasFace: false },
      { id: 'blue', label: 'Blue stage light', rect: { x: 0.0, y: 0.0, w: 0.42, h: 0.3 }, hasFace: false },
    ],
  },
];

export function sampleById(id) {
  return SAMPLES.find((s) => s.id === id) || SAMPLES[0];
}

// A crop window for a face shot: the face box with a margin, widened or
// narrowed to the panel's aspect ratio, clamped inside the photo. The face
// box itself is always fully inside the returned window.
export function faceSafeWindow(sample, aspect) {
  const f = sample.face;
  const pad = 0.10;
  let x = Math.max(0, f.x - pad);
  let y = Math.max(0, f.y - pad);
  let w = Math.min(1 - x, f.w + pad * 2);
  let h = Math.min(1 - y, f.h + pad * 2);
  const want = w / h;
  if (aspect > want) {
    // Panel is wider than the face window: widen it, keep the face centred.
    const nw = Math.min(1, h * aspect);
    const cx = f.x + f.w / 2;
    x = Math.max(0, Math.min(1 - nw, cx - nw / 2));
    w = nw;
  } else {
    // Panel is taller: grow height, keep the face inside.
    const nh = Math.min(1, w / aspect);
    const cy = f.y + f.h / 2;
    y = Math.max(0, Math.min(1 - nh, cy - nh / 2));
    h = nh;
  }
  // Final safety: the face box must lie inside the window.
  x = Math.min(x, f.x);
  y = Math.min(y, f.y);
  w = Math.max(w, f.x + f.w - x);
  h = Math.max(h, f.y + f.h - y);
  return { x, y, w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) };
}

// Default crop for a user-uploaded photo (no measured face): bias to the
// upper third, where a face usually sits, and keep it wide enough to hold
// a head. The user can drag and zoom any panel afterwards.
export function defaultUploadWindow(aspect) {
  const w = 0.92;
  const h = Math.min(0.92, w / aspect);
  return { x: 0.04, y: 0.03, w, h };
}
