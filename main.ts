// Neon Coast Cover Studio v2 — make.fun gta6-cover-art-01 entry program.
//
// The entry is a static offline web app: app/index.html plus its modules,
// vendored fonts and sample photos. This program (Node 22, standard library
// only) hands the app in by copying app/ and screenshots/ from this
// repository into the grader's output directory and writing the dossier
// there with the kit's vendored buildDossier library.
//
// Run it locally the same way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice and the two outputs must be byte-identical.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Start from a clean slate so a stale file from an earlier run can never
// leak into this entry's output.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const appOut = join(outDir, "app");
cpSync(join(repoRoot, "app"), appOut, { recursive: true });

const shotsOut = join(outDir, "screenshots");
mkdirSync(shotsOut, { recursive: true });
if (existsSync(join(repoRoot, "screenshots"))) {
  cpSync(join(repoRoot, "screenshots"), shotsOut, { recursive: true });
}

// The sealed gate's own limits (reference/gate.json in the kit): the text
// cap shapes the dossier bytes; the rest refuse an entry the scorer would
// refuse, so an oversized entry fails here first, loudly, instead of
// silently at grading time.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, "dossier.json"), dossier);
