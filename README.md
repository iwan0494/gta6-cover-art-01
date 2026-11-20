# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/iwan0494/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/iwan0494/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Neon Coast Cover Studio v2** — an offline browser app that turns any photo
and caption into GTA 6-style key art: a hero close-up that pops out of the
grid, a cast of different photos in every panel, face-aware crops, a chrome
3D title, neon script subtitle, role tags, billing block and seal — exported
as PNG in 1080x1080, 1080x1350 and 1920x1080. Photos never leave the machine.
Built for make.fun's
[Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01) bounty.

## What v2 changes vs v1

- **Key Art layout**: hero close-up breaks the grid, 6 more panels each show
  a different photo or a different shot — never the same crop twice.
- **Face-aware crops**: every sample photo carries a measured face box and
  several shots (close-up, full figure, detail, scene); crops grow around
  the face, so heads are never cut at the neck.
- **Chrome 3D title**: Anton lettering with a chrome gradient, striped
  sunset shadow and top highlight; Pacifico neon subtitle.
- **Poster furniture**: quote bar, role tags, ribbon, billing block, round
  seal, barcode, "COMING SOON" — the cover reads as a movie poster.
- **9 grades** (was 5): Sunset, Neon Night, Teal Pink, Golden Hour, Noir,
  Vice Violet, Blood Orange, Miami Mint, Chrome Mono.
- **5 sample photos** (was 2): boulevard driver, pier captain, graffiti
  artist (CC0), red-lips close-up, night-shift singer.

## Run it

```sh
node serve.ts   # open http://localhost:8080
```

Pick a layout and a grade, type a title, click a panel to crop it, then
"Ekspor 3 PNG" downloads all three post sizes at once.

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the kit's vendored
`buildDossier` library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=sgfqk6h8&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
