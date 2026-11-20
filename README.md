# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/iwan0494/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/iwan0494/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn any photo into a GTA 6-style key-art cover — a multi-panel movie
poster with a pop-out hero, retro-chrome 3D title, and full film-poster
furniture. It runs entirely offline in a desktop browser; photos never
leave the machine.

## What it does

- **6 layouts** — Key Art (hero pop-out), Hero + 3, Four Panel, Full Bleed,
  Nine Panel, Snapshot (tilted overlapping photos).
- **9 colour grades** — Sunset, Neon Night, Teal Pink, Golden Hour, Noir,
  Vice Blue, Heatwave, Lavender Dusk, Mono Gold — each with sky glow,
  vignette and film grain.
- **Face-aware crops** — every sample photo carries a measured face box, so
  panels keep faces whole at every size and every aspect ratio. A face is
  never drawn twice in one cover; a photo only repeats through a faceless
  detail shot.
- **Chrome 3D title** — silver-to-gold-to-pink gradient with layered
  extrusion on a halftone title block, plus a neon Pacifico subtitle.
- **Poster furniture** — role tags, five-star quote bar, ribbon, billing
  block, circular 2026 seal, barcode, COMING SOON, VOL. 1 chip.
- **Editor** — upload your own photo, drag any panel to reframe, scroll to
  zoom, cycle shots per panel, undo/redo, edit title and subtitle.
- **Export** — one click downloads the cover as PNG in all three post sizes:
  1080×1080, 1080×1350, 1920×1080.

## Run it

Open `app/index.html` in desktop Chrome. No server, no network needed.
Fonts (Anton, Pacifico) are vendored under `app/fonts/` under the SIL Open
Font License 1.1 (see `app/fonts/OFL.txt`).

## Build the submission

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22) copies `app/` and `screenshots/` into the output
directory and writes `dossier.json` via the kit's `buildDossier`.

## Screenshots

- `screenshots/1-cover.jpg` — Key Art cover, landscape
- `screenshots/2-editor.jpg` — the editor with a photo loaded
- `screenshots/3-cover-portrait.jpg` — Key Art cover, portrait
- `screenshots/4-cover-square.jpg` — Hero Pop-Out cover, square

## Photo credits

- `samples/boulevard.jpg`, `samples/pier.jpg` — kit starter photos.
- `samples/graffiti.jpg` — "Graffiti Portrait Bülowstraße
  Berlin-Schöneberg", CC0, Wikimedia Commons.
- `samples/portrait.jpg` — "Smiling senior woman with curly hair
  portrait", CC BY 2.0, Wikimedia Commons.
- `samples/singer.jpg` — "Jack Johnson 2014", CC BY-SA 4.0, photo by
  @Photocyclone, Wikimedia Commons.

No Rockstar Games logos, official artwork, or game fonts are used anywhere.
