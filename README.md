# Neon Coast Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/iwan0494/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/iwan0494/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn any photo into multi-panel GTA 6-style cover art — a key-art poster with a
hero close-up, face-aware crops, a retro-chrome 3D title and full movie-poster
furniture — then export it as a PNG to share. Made for the
[make.fun](https://make.fun/bounty/gta6-cover-art-01) bounty "Make GTA 6 Cover Art".

## What it does

- **Key-art covers from any photo** — upload your own photos or use the five
  free-licensed sample cast members (The Driver, The Captain, The Artist,
  The Lookout, The Singer). Every panel shows a different shot; a face never
  appears twice in one cover.
- **Face-aware crops** — each sample photo carries a measured face box, so
  crops always keep the face whole. Uploaded photos default to an upper-third
  crop and can be dragged and zoomed per panel.
- **Hero pop-out** — the hero close-up tilts -1.5°, breaks over the title band
  and carries layered shadows and a gold frame, like a cut-out on a poster.
- **Retro-chrome 3D title** — Anton in a silver-gold-pink chrome gradient with
  layered extrusion on a halftone title block, plus a neon Pacifico subtitle.
- **Poster furniture** — role tags, five-star quote bar, ribbon, billing block,
  circular 2026 seal, barcode and COMING SOON.
- **6 layouts, 9 grades** — Key Art, Hero Pop-Out, Hero+3, Four Panel,
  Full-Bleed and Nine Grid; Sunset, Neon Night, Teal Pink, Golden Hour, Noir,
  Vice Violet, Blood Orange, Miami Mint and Chrome Mono, with grain, vignette
  and sky glow.
- **Undo / redo** — every edit snapshots the state before the change.
- **One-click export** — 1080×1080, 1080×1350 and 1920×1080 PNGs at once.

## Run it (offline)

The app is plain static files — no server, no network, photos never leave the
machine:

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` directly in desktop Chrome.

## Screenshots

- `screenshots/1-cover.jpg` — Key Art cover, Sunset grade (1280×720)
- `screenshots/2-editor.jpg` — the editor with a photo loaded (1280×720)
- `screenshots/3-cover-portrait.jpg` — Key Art cover, Neon Night (1024×1280)
- `screenshots/4-cover-square.jpg` — Hero Pop-Out, Golden Hour (1080×1080)

Deterministic screenshot modes live in `shots.json` (`?shot=cover` /
`?shot=editor`).

## Credits

- Fonts: Anton and Pacifico, SIL Open Font License 1.1 (see `app/fonts/OFL.txt`).
- Sample photos: the two kit photos plus three CC0 photos (Openverse).
- Everything in the cover art is invented: no Rockstar Games logo, official
  artwork or game fonts.

## License

MIT — see [LICENSE](LICENSE).
