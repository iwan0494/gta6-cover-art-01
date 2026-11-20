// Neon Coast Cover Studio — submission program (Node 22, stdlib only).
//
// What it hands in: a copy of app/ (the offline browser app) and
// screenshots/ (the four dossier frames), plus dossier.json built by
// the vendored make.fun library. The grader reads /output; outside
// the grader, MAKEFUN_OUTPUT_DIR stands in for it:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Gate limits (competition.yaml / reference/gate.json): app/ at most
// 993 files and 48 MiB, paths at most 1000 bytes, index.html at most
// 1 MiB, 3-4 screenshots at most 256 KiB each, dossier at most 1.5 MiB
// with at most 160 KiB of text.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output dir so a stale file can never leak in.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const appOut = join(outDir, 'app');
cpSync(join(repoRoot, 'app'), appOut, { recursive: true });

const shotsOut = join(outDir, 'screenshots');
mkdirSync(shotsOut, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsOut, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
