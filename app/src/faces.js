// Neon Coast Cover Studio — sample cast and face-safe shot catalogue.
//
// Every face box below was measured by looking at the photo itself, as
// fractions of the image (x, y, w, h). A "shot" is a crop window into one
// photo. Face shots always keep the whole face inside the frame; detail
// shots carry no face at all. Nothing here is read from an earlier build:
// the boxes were re-measured in this session from the photos as they are.
//
// Licences (credits also in README.md):
//   boulevard, pier — kit starter photos
//   graffiti — "Graffiti Portrait Bülowstraße Berlin-Schöneberg", CC0, Wikimedia Commons
//   portrait — "Smiling senior woman with curly hair portrait", CC BY 2.0, Wikimedia Commons
//   singer — "Jack Johnson 2014", CC BY-SA 4.0, photo by @Photocyclone, Wikimedia Commons

export const CAST = [
  {
    id: "boulevard",
    src: "samples/boulevard.jpg",
    role: "THE DRIVER",
    face: { x: 0.29, y: 0.04, w: 0.25, h: 0.22 },
    shots: [
      { id: "face", label: "Driver close-up", face: true, focus: { x: 0.42, y: 0.15 } },
      { id: "full", label: "Driver and car", face: true, focus: { x: 0.45, y: 0.45 } },
      { id: "car", label: "Red car detail", face: false, focus: { x: 0.22, y: 0.78 } },
      { id: "palms", label: "Palm boulevard", face: false, focus: { x: 0.12, y: 0.3 } },
    ],
  },
  {
    id: "pier",
    src: "samples/pier.jpg",
    role: "THE CAPTAIN",
    face: { x: 0.26, y: 0.1, w: 0.32, h: 0.3 },
    shots: [
      { id: "face", label: "Captain close-up", face: true, focus: { x: 0.42, y: 0.25 } },
      { id: "full", label: "Captain and rod", face: true, focus: { x: 0.45, y: 0.5 } },
      { id: "rod", label: "Reel detail", face: false, focus: { x: 0.72, y: 0.72 } },
      { id: "sea", label: "Pier and sea", face: false, focus: { x: 0.75, y: 0.45 } },
    ],
  },
  {
    id: "graffiti",
    src: "samples/graffiti.jpg",
    role: "THE ARTIST",
    face: { x: 0.22, y: 0.13, w: 0.4, h: 0.3 },
    shots: [
      { id: "face", label: "Mural face", face: true, focus: { x: 0.42, y: 0.28 } },
      { id: "mural", label: "Whole mural", face: true, focus: { x: 0.5, y: 0.5 } },
      { id: "arch", label: "Painted arch", face: false, focus: { x: 0.5, y: 0.72 } },
    ],
  },
  {
    id: "portrait",
    src: "samples/portrait.jpg",
    role: "THE LOOKOUT",
    face: { x: 0.2, y: 0.06, w: 0.37, h: 0.3 },
    shots: [
      { id: "face", label: "Lookout close-up", face: true, focus: { x: 0.38, y: 0.21 } },
      { id: "smile", label: "Lookout smile", face: true, focus: { x: 0.4, y: 0.3 } },
      { id: "room", label: "Lookout at home", face: true, focus: { x: 0.45, y: 0.45 } },
    ],
  },
  {
    id: "singer",
    src: "samples/singer.jpg",
    role: "THE SINGER",
    face: { x: 0.46, y: 0.08, w: 0.31, h: 0.27 },
    shots: [
      { id: "face", label: "Singer close-up", face: true, focus: { x: 0.61, y: 0.21 } },
      { id: "stage", label: "Singer and guitar", face: true, focus: { x: 0.58, y: 0.5 } },
      { id: "guitar", label: "Guitar detail", face: false, focus: { x: 0.38, y: 0.68 } },
    ],
  },
];

export function photoById(id) {
  return CAST.find((p) => p.id === id) || CAST[0];
}

export function shotById(photo, shotId) {
  return photo.shots.find((s) => s.id === shotId) || photo.shots[0];
}

// Crop window (fractions of the photo) for one shot at one panel aspect.
// Face shots are built from the face box: the face plus a margin is the
// smallest window allowed, and the window only ever grows from there, so a
// narrow panel zooms OUT instead of slicing the face at the panel edge.
// Detail shots centre on their focus point at a fixed zoom.
export function shotWindow(photo, shot, aspect, zoom = 1) {
  const f = photo.face;
  if (shot.face) {
    // Smallest allowed window: the face plus a margin on every side.
    const fx = Math.max(0, f.x - f.w * 0.42);
    const fy = Math.max(0, f.y - f.h * 0.42);
    const fw = Math.min(1 - fx, f.w * 1.84);
    const fh = Math.min(1 - fy, f.h * 1.84);
    // Grow to the panel aspect, then shrink to fit the photo if needed.
    // Either way the window keeps the target aspect, stays inside the
    // photo, and still contains the whole face.
    let w = Math.max(fw, fh * aspect);
    let h = w / aspect;
    if (w > 1) {
      w = 1;
      h = 1 / aspect;
    }
    if (h > 1) {
      h = 1;
      w = aspect;
    }
    // Zoom around the face centre (editor), then centre and clamp.
    if (zoom !== 1) {
      w = Math.min(1, w / zoom);
      h = Math.min(1, h / zoom);
    }
    const cx = f.x + f.w / 2;
    const cy = f.y + f.h / 2;
    const x = Math.max(0, Math.min(1 - w, cx - w / 2));
    const y = Math.max(0, Math.min(1 - h, cy - h / 2));
    return { x, y, w, h };
  }
  // Detail shot: fixed-size window on the focus point, aspect-matched.
  const base = 0.62 / zoom;
  let h = Math.min(1, base);
  let w = h * aspect;
  if (w > 1) {
    w = 1;
    h = 1 / aspect;
  }
  const x = Math.max(0, Math.min(1 - w, shot.focus.x - w / 2));
  const y = Math.max(0, Math.min(1 - h, shot.focus.y - h / 2));
  return { x, y, w, h };
}

// Default crop for a photo the user uploads: biased to the upper third,
// where a face usually sits, so the first render is already sensible.
export function uploadWindow(aspect) {
  const w = 1;
  const h = Math.min(1, w / aspect);
  return { x: 0, y: 0.04, w, h };
}
