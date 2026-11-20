// faces.js — measured face boxes and per-photo shot list for Neon Coast.
// Every rect is a fraction of the source photo (0..1). Face boxes were
// measured by looking at each sample photo: they bound the whole head
// (hair included) so a crop that contains the box never cuts a face.

export const SAMPLES = [
  {
    id: 'boulevard',
    file: 'samples/boulevard.jpg',
    role: 'THE DRIVER',
    // Woman in sunglasses leaning on a red convertible at sunset.
    face: { x: 0.27, y: 0.04, w: 0.27, h: 0.26 },
    shots: [
      { name: 'face', rect: { x: 0.20, y: 0.0, w: 0.42, h: 0.34 }, face: true },
      { name: 'wide', rect: { x: 0.0, y: 0.0, w: 1.0, h: 0.72 }, face: true },
      { name: 'detail', rect: { x: 0.52, y: 0.52, w: 0.48, h: 0.48 }, face: false },
    ],
  },
  {
    id: 'pier',
    file: 'samples/pier.jpg',
    role: 'THE CAPTAIN',
    // Older man in a bucket hat holding a fishing rod on a pier.
    face: { x: 0.19, y: 0.05, w: 0.29, h: 0.23 },
    shots: [
      { name: 'face', rect: { x: 0.10, y: 0.0, w: 0.48, h: 0.36 }, face: true },
      { name: 'wide', rect: { x: 0.0, y: 0.0, w: 0.78, h: 0.78 }, face: true },
      { name: 'detail', rect: { x: 0.52, y: 0.42, w: 0.48, h: 0.5 }, face: false },
    ],
  },
  {
    id: 'graffiti',
    file: 'samples/graffiti.jpg',
    role: 'THE ARTIST',
    // Painted face on a brick wall above a blue mosaic arch.
    face: { x: 0.24, y: 0.16, w: 0.42, h: 0.26 },
    shots: [
      { name: 'face', rect: { x: 0.14, y: 0.10, w: 0.62, h: 0.38 }, face: true },
      { name: 'wide', rect: { x: 0.0, y: 0.05, w: 1.0, h: 0.62 }, face: true },
      { name: 'detail', rect: { x: 0.08, y: 0.52, w: 0.84, h: 0.46 }, face: false },
    ],
  },
  {
    id: 'portrait',
    file: 'samples/portrait.jpg',
    role: 'THE LOOKOUT',
    // Smiling curly-haired woman resting her chin on her hand.
    face: { x: 0.12, y: 0.07, w: 0.41, h: 0.29 },
    shots: [
      { name: 'face', rect: { x: 0.02, y: 0.0, w: 0.60, h: 0.42 }, face: true },
      { name: 'wide', rect: { x: 0.0, y: 0.0, w: 1.0, h: 0.66 }, face: true },
      { name: 'detail', rect: { x: 0.05, y: 0.55, w: 0.9, h: 0.43 }, face: false },
    ],
  },
  {
    id: 'singer',
    file: 'samples/singer.jpg',
    role: 'THE SINGER',
    // Guitarist on a blue-lit stage, head tilted down at the guitar.
    face: { x: 0.44, y: 0.08, w: 0.31, h: 0.28 },
    shots: [
      { name: 'face', rect: { x: 0.36, y: 0.02, w: 0.48, h: 0.40 }, face: true },
      { name: 'wide', rect: { x: 0.0, y: 0.0, w: 1.0, h: 0.62 }, face: true },
      { name: 'detail', rect: { x: 0.02, y: 0.55, w: 0.58, h: 0.43 }, face: false },
    ],
  },
];

export function sampleById(id) {
  return SAMPLES.find((s) => s.id === id) || SAMPLES[0];
}

// Default crop for a user-uploaded photo: bias to the upper third where
// a face usually sits, wide enough to keep shoulders in frame.
export function defaultUploadFace() {
  return { x: 0.22, y: 0.04, w: 0.56, h: 0.34 };
}

export function uploadShots() {
  return [
    { name: 'face', rect: { x: 0.15, y: 0.0, w: 0.7, h: 0.45 }, face: true },
    { name: 'wide', rect: { x: 0.0, y: 0.0, w: 1.0, h: 0.75 }, face: true },
    { name: 'detail', rect: { x: 0.1, y: 0.55, w: 0.8, h: 0.45 }, face: false },
  ];
}
