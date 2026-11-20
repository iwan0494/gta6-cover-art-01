// faces.js — registri foto contoh + kotak wajah + shot per foto.
// Semua koordinat adalah fraksi 0..1 dari lebar/tinggi foto asli.
// Kotak wajah diukur dengan melihat langsung tiap foto contoh.
// Aturan keras: satu wajah yang sama tidak boleh muncul dua kali dalam
// satu cover — foto yang terpaksa diulang HARUS memakai shot faceless
// (detail: mobil, laut, tembok, gitar, lampu), dicek oleh shotHasFace().
// Shot faceless tersedia dalam DUA varian: wide (aspek ~2.2, untuk panel
// lebar) dan tall (aspek ~0.6, untuk panel tegak). Alasannya: fitting
// crop ke aspek panel bisa menarik wajah masuk lagi — varian yang aspeknya
// dekat dengan panel tidak perlu melebar jauh, jadi wajah tetap di luar.
// pickFacelessShot() memverifikasi hasil fitting-nya secara eksplisit.

// ---------------------------------------------------------------- foto kit
// boulevard.jpg — wanita bersandar di convertible merah saat sunset.
const BOULEVARD = {
  id: 'boulevard', src: 'samples/boulevard.jpg',
  label: 'Boulevard Sunset', role: 'THE DRIVER',
  face: { x: 0.42, y: 0.07, w: 0.27, h: 0.26 },
  shots: [
    { id: 'face', label: 'Close-up wajah', rect: { x: 0.30, y: 0.00, w: 0.50, h: 0.45 } },
    { id: 'full', label: 'Figur + mobil',  rect: { x: 0.05, y: 0.00, w: 0.90, h: 0.75 } },
    { id: 'car',  label: 'Detail mobil',   rect: { x: 0.15, y: 0.60, w: 0.70, h: 0.40 } },
    { id: 'palm', label: 'Jalanan palem',  rect: { x: 0.72, y: 0.00, w: 0.28, h: 0.55 } },
    { id: 'street', label: 'Aspal + mobil', rect: { x: 0.00, y: 0.65, w: 0.55, h: 0.35 } },
  ],
};

// pier.jpg — pria tua bertopi bucket + pancing di dermaga.
const PIER = {
  id: 'pier', src: 'samples/pier.jpg',
  label: 'Pier Angler', role: 'THE CAPTAIN',
  face: { x: 0.27, y: 0.12, w: 0.30, h: 0.30 },
  shots: [
    { id: 'face', label: 'Close-up wajah', rect: { x: 0.12, y: 0.00, w: 0.60, h: 0.50 } },
    { id: 'full', label: 'Figur + pancing', rect: { x: 0.00, y: 0.00, w: 0.75, h: 0.85 } },
    { id: 'sea',  label: 'Dermaga + laut', rect: { x: 0.35, y: 0.62, w: 0.65, h: 0.30 } },
    { id: 'sky',  label: 'Langit dermaga', rect: { x: 0.55, y: 0.00, w: 0.45, h: 0.60 } },
    { id: 'dock', label: 'Papan dermaga',  rect: { x: 0.55, y: 0.60, w: 0.45, h: 0.40 } },
  ],
};

// ------------------------------------------------------------- foto baru CC0
// graffiti.jpg — CC0 StockSnap, wanita pirang berkacamata + kaleng semprot
// di depan tembok grafiti. Foto: Matt Moloney.
const GRAFFITI = {
  id: 'graffiti', src: 'samples/graffiti.jpg',
  label: 'Graffiti Wall', role: 'THE ARTIST',
  face: { x: 0.36, y: 0.28, w: 0.27, h: 0.20 },
  shots: [
    { id: 'face',  label: 'Close-up wajah', rect: { x: 0.22, y: 0.15, w: 0.55, h: 0.50 } },
    { id: 'full',  label: 'Figur + kaleng', rect: { x: 0.05, y: 0.10, w: 0.90, h: 0.80 } },
    { id: 'wall',  label: 'Detail tembok',  rect: { x: 0.00, y: 0.60, w: 1.00, h: 0.40 } },
    { id: 'spray', label: 'Detail semprot', rect: { x: 0.68, y: 0.45, w: 0.32, h: 0.55 } },
    { id: 'ground', label: 'Lantai grafiti', rect: { x: 0.30, y: 0.68, w: 0.55, h: 0.32 } },
  ],
};

// portrait.jpg — picsum / Unsplash id 1027, close-up wajah wanita,
// bibir merah. Dipakai sebagai HERO default (wajah paling tajam).
// Foto ini TIDAK punya shot faceless — hanya dipakai sekali (hero).
const PORTRAIT = {
  id: 'portrait', src: 'samples/portrait.jpg',
  label: 'Red Lips Close-up', role: 'THE LOOKOUT',
  face: { x: 0.30, y: 0.05, w: 0.48, h: 0.75 },
  shots: [
    { id: 'face',     label: 'Close-up wajah', rect: { x: 0.18, y: 0.00, w: 0.72, h: 0.90 } },
    { id: 'shoulder', label: 'Wajah + bahu',   rect: { x: 0.05, y: 0.00, w: 0.90, h: 1.00 } },
  ],
};

// singer.jpg — picsum id 453, penyanyi barjanggut B&W dengan gitar di panggung.
const SINGER = {
  id: 'singer', src: 'samples/singer.jpg',
  label: 'Stage Singer', role: 'THE SINGER',
  face: { x: 0.44, y: 0.25, w: 0.20, h: 0.18 },
  shots: [
    { id: 'face',   label: 'Close-up wajah',  rect: { x: 0.30, y: 0.12, w: 0.45, h: 0.45 } },
    { id: 'full',   label: 'Figur + gitar',   rect: { x: 0.15, y: 0.10, w: 0.70, h: 0.85 } },
    { id: 'guitar', label: 'Detail gitar',    rect: { x: 0.40, y: 0.55, w: 0.60, h: 0.28 } },
    { id: 'lights', label: 'Lampu panggung',  rect: { x: 0.00, y: 0.00, w: 0.35, h: 0.55 } },
    { id: 'stage',  label: 'Lantai panggung', rect: { x: 0.55, y: 0.60, w: 0.45, h: 0.40 } },
  ],
};

export const SAMPLE_PHOTOS = [BOULEVARD, PIER, GRAFFITI, PORTRAIT, SINGER];
export const HERO_PHOTO_ID = 'portrait';

export function photoById(id) {
  return SAMPLE_PHOTOS.find((p) => p.id === id) || null;
}

export function shotById(photo, shotId) {
  if (!photo) return null;
  return photo.shots.find((s) => s.id === shotId) || photo.shots[0];
}

// Tengah kotak wajah (fraksi). Dipakai untuk uji faceless + face-aware crop.
export function faceCentre(photo) {
  const f = photo.face;
  return { x: f.x + f.w / 2, y: f.y + f.h / 2 };
}

// True bila shot ini MEMUAT wajah (pusat wajah di dalam rect shot,
// dengan margin 5% supaya crop tepi tidak "nyaris" memuat wajah).
export function shotHasFace(photo, shot) {
  const c = faceCentre(photo);
  const m = 0.05;
  return (
    c.x > shot.rect.x + m && c.x < shot.rect.x + shot.rect.w - m &&
    c.y > shot.rect.y + m && c.y < shot.rect.y + shot.rect.h - m
  );
}

// Daftar shot faceless dari sebuah foto (detail tanpa wajah).
export function facelessShots(photo) {
  return photo.shots.filter((s) => !shotHasFace(photo, s));
}

// Perluas / persempit rect crop di sekitar pusatnya agar rasionya sama
// dengan aspek panel target, lalu jepit ke dalam bingkai foto 0..1.
// Wajah tidak pernah terpotong: rect hasil selalu memuat pusat wajah
// bila rect asal memuatnya (perluasan simetris di sekitar pusat rect).
export function fitRectToAspect(rect, aspect) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  let w = rect.w;
  let h = rect.h;
  const cur = w / h;
  if (cur > aspect) h = w / aspect; // terlalu lebar -> tinggikan
  else w = h * aspect;             // terlalu tinggi -> lebarkan
  let x = cx - w / 2;
  let y = cy - h / 2;
  if (x < 0) { w += x; x = 0; }
  if (y < 0) { h += y; y = 0; }
  if (x + w > 1) w = 1 - x;
  if (y + h > 1) h = 1 - y;
  return { x, y, w, h };
}

// Jarak (clearance) antara rect hasil fitting dan kotak wajah:
// positif = ada celah, negatif = rect menyerempet/masuk kotak wajah.
// Dipakai supaya crop detail tidak "menyerempet dagu" — kepala yang
// terpotong di tepi panel terbaca sebagai crop gagal walau wajah tak utuh.
export function faceClearance(photo, shot, aspect) {
  const f = fitRectToAspect(shot.rect, aspect);
  const b = photo.face;
  const m = 0.05; // margin aman di sekeliling kotak wajah
  const bx0 = b.x - m, by0 = b.y - m, bx1 = b.x + b.w + m, by1 = b.y + b.h + m;
  const fx0 = f.x, fy0 = f.y, fx1 = f.x + f.w, fy1 = f.y + f.h;
  const overlapX = Math.min(fx1, bx1) - Math.max(fx0, bx0);
  const overlapY = Math.min(fy1, by1) - Math.max(fy0, by0);
  if (overlapX > 0 && overlapY > 0) return -Math.min(overlapX, overlapY);
  const dx = Math.max(bx0 - fx1, fx0 - bx1, 0);
  const dy = Math.max(by0 - fy1, fy0 - by1, 0);
  return Math.hypot(dx, dy);
}

// True bila kotak wajah (+margin) tetap di LUAR rect hasil fitting.
// Ini uji yang sebenarnya dipakai render — bukan cuma rect mentah.
export function fittedStaysFaceless(photo, shot, aspect) {
  return faceClearance(photo, shot, aspect) > 0;
}

// Pilih shot faceless dari `photo` yang TETAP faceless setelah di-fit
// ke aspek panel, paling dekat aspeknya dengan panel. `exclude` = daftar
// id shot yang sudah dipakai (supaya tidak ada dua panel dengan shot sama).
// Kembalikan { photo, shot } atau null.
export function pickFacelessShot(photo, aspect, exclude = []) {
  const pool = facelessShots(photo).filter((s) => !exclude.includes(s.id));
  if (!pool.length) return null;
  const scored = pool.map((s) => ({
    shot: s,
    clear: faceClearance(photo, s, aspect),
    aspectGap: Math.abs(Math.log((s.rect.w / s.rect.h) / aspect)),
  }));
  const passing = scored.filter((c) => c.clear > 0)
    .sort((a, b) => a.aspectGap - b.aspectGap);
  if (passing.length) return { photo: photo.id, shot: passing[0].shot.id };
  // Best effort: clearance terbesar (paling jauh dari wajah).
  scored.sort((a, b) => b.clear - a.clear || a.aspectGap - b.aspectGap);
  return { photo: photo.id, shot: scored[0].shot.id };
}

// Sama, tapi mencari di semua foto kecuali `excludePhotoId`.
// Dipakai bila foto yang sama sudah kehabisan shot faceless yang cocok.
export function pickFacelessShotAny(aspect, excludePhotoId, excludePairs = []) {
  for (const p of SAMPLE_PHOTOS) {
    if (p.id === excludePhotoId) continue;
    const exclude = excludePairs
      .filter((pr) => pr.photo === p.id)
      .map((pr) => pr.shot);
    const pick = pickFacelessShot(p, aspect, exclude);
    if (pick) return pick;
  }
  return null;
}

// Crop default untuk foto upload pengguna: bias sepertiga atas
// (wajah biasanya di sana), lebar penuh, tinggi 2/3.
export function uploadCrop() {
  return { x: 0, y: 0, w: 1, h: 0.66 };
}

// RNG kecil deterministik (mulberry32) supaya shuffle cast stabil.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Bagi peran (cast) ke `count` panel.
// - Slot 0 (hero) selalu: portrait / close-up wajah.
// - Slot lain: foto berbeda dulu (shot 'face'/'full' bergantian).
// - Kalau panel lebih banyak dari foto (9-panel): foto boleh diulang,
//   TAPI hanya lewat shot faceless yang belum dipakai — wajah yang sama
//   tidak pernah muncul dua kali.
// - Tidak ada dua panel dengan pasangan foto:shot yang identik.
// CATATAN: dealCast tidak tahu aspek panel — guard akhir yang memastikan
// shot faceless tetap faceless setelah fitting ada di cover.defaultPanels.
export function dealCast(count, seed = 7, heroPhotoId = HERO_PHOTO_ID) {
  const rand = rng(seed);
  const hero = photoById(heroPhotoId) || SAMPLE_PHOTOS[0];
  const cast = [{ photo: hero.id, shot: 'face' }];
  const usedPairs = new Set([hero.id + ':face']);

  const others = shuffle(SAMPLE_PHOTOS.filter((p) => p.id !== hero.id), rand);
  // Putaran 1: satu foto berbeda per panel, shot berwajah.
  for (const p of others) {
    if (cast.length >= count) break;
    const faceShots = p.shots.filter((s) => shotHasFace(p, s));
    const pick = faceShots.find((s) => !usedPairs.has(p.id + ':' + s.id)) || faceShots[0];
    cast.push({ photo: p.id, shot: pick.id });
    usedPairs.add(p.id + ':' + pick.id);
  }
  // Putaran 2 (hanya bila panel > foto): ulang foto lewat shot faceless.
  const pool = shuffle(SAMPLE_PHOTOS.slice(), rand);
  let guard = 0;
  while (cast.length < count && guard++ < 40) {
    const p = pool[guard % pool.length];
    const free = facelessShots(p).filter((s) => !usedPairs.has(p.id + ':' + s.id));
    if (!free.length) continue;
    const pick = free[Math.floor(rand() * free.length)];
    cast.push({ photo: p.id, shot: pick.id });
    usedPairs.add(p.id + ':' + pick.id);
  }
  // Darurat: masih kurang (seharusnya tidak terjadi) — isi shot apa pun
  // yang belum dipakai, faceless diutamakan.
  guard = 0;
  while (cast.length < count && guard++ < 80) {
    const p = SAMPLE_PHOTOS[guard % SAMPLE_PHOTOS.length];
    const cands = p.shots.filter((s) => !usedPairs.has(p.id + ':' + s.id));
    if (!cands.length) continue;
    const facelessFirst = cands.filter((s) => !shotHasFace(p, s));
    const pick = (facelessFirst[0] || cands[0]);
    cast.push({ photo: p.id, shot: pick.id });
    usedPairs.add(p.id + ':' + pick.id);
  }
  return cast.slice(0, count);
}
