// Neon Coast Cover Studio — entry program for make.fun gta6-cover-art-01.
// Node 22, standard library only. Hands in the offline browser app: copies
// app/ and screenshots/ from beside this file into /output and writes
// /output/dossier.json with the kit's vendored buildDossier library, so the
// judge reads exactly the app the repository holds. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Gate caps from the competition (reference/gate.json): app/ at most 993
// files / 48 MiB, paths at most 1000 bytes, 3-4 screenshots at most 256 KiB,
// dossier at most 1.5 MiB with 160 KiB of source text. The program refuses
// nothing itself — it hands in exactly what the repo holds.
const DOSSIER_TEXT_MAX_BYTES = 163840;
const SCREENSHOT_MAX_COUNT = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const APP_MAX_FILES = 993;
const APP_MAX_BYTES = 50331648;
const APP_PATH_MAX_BYTES = 1000;

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
  screenshots: { max: SCREENSHOT_MAX_COUNT, max_bytes: SCREENSHOT_MAX_BYTES },
  app_max_files: APP_MAX_FILES,
  app_max_bytes: APP_MAX_BYTES,
  app_path_max_bytes: APP_PATH_MAX_BYTES,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
