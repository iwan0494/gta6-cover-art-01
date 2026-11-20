// main.ts — the entrypoint of Neon Coast Cover Studio (Node 22).
// It copies the offline web app (app/) and its screenshots into the output
// directory and writes dossier.json through the kit's buildDossier, under
// the competition's own gate caps. Run it twice: the output is byte for
// byte identical, because the dossier is canonical JSON.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The gate's own caps (competition.yaml, reference/gate.json): the app is
// at most 993 files and 48 MiB, each path at most 1000 bytes, at most four
// screenshots of 256 KiB, the dossier's text at most 160 KiB.
const CAPS = {
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || join(here, 'out'));

for (const name of ['app', 'screenshots']) {
  const src = join(here, name);
  if (!existsSync(src)) {
    throw new Error(`main.ts: missing ${name}/ next to main.ts`);
  }
  cpSync(src, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
const dossier = buildDossier(outDir, CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
