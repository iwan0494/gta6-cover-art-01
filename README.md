# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/iwan0494/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/iwan0494/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Neon Coast Cover Studio** — an offline browser app that turns any photo
and caption into GTA 6-style multi-panel cover art (Vice City neon-sunset
grade, bold caption lettering), exported as PNG in 1080x1080, 1080x1350 and
1920x1080. Photos never leave the machine. Built for make.fun's
[Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01) bounty.

## Features

- **6 layouts**: Hero + 3, 4-panel grid, full-bleed, 9-panel grid, tilted
  snapshot frames, and a vertical Story layout.
- **5 colour grades**: Sunset, Neon Night, Teal Pink, Golden Hour, Noir —
  gradient-map wash plus grain and vignette, all rendered on canvas.
- **Any photo**: upload one photo for every panel or a different photo per
  panel; drag to pan and zoom/crop each panel; two free sample photos included.
- **Caption studio**: bold Anton title with outline, glowing Pacifico neon
  subtitle, size and position controls (top / centre / bottom).
- **Fast export**: one click downloads all three post sizes at once —
  1080x1080, 1080x1350, 1920x1080 PNG.
- **Undo / redo**, live preview, fully offline (no network requests; fonts
  Anton + Pacifico vendored under `app/fonts/` under the SIL Open Font License).

## Run it

```sh
node serve.ts   # open http://localhost:8080
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the kit's vendored
`buildDossier` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Original work: no Rockstar Games logo, artwork, or font is used anywhere.

---

<sub>Entered on [make.fun](https://make.fun/?ref=sgfqk6h8&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
