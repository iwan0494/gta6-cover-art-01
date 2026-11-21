// Neon Coast Cover Studio — the entry program.
//
// It hands in the offline browser app: copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json with
// the kit's vendored buildDossier library, so the judge reads exactly the
// app the repository holds. Node 22, standard library only.
//
// The output directory is whatever the grader gives it: /output in the
// sandbox, MAKEFUN_OUTPUT_DIR anywhere else:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// One rule the grader taught us the hard way: never delete the output
// directory itself. In the sandbox the program runs as uid 65534, /output
// is writable, but its parent / belongs to root — removing /output needs
// write permission on /, and the run dies with EACCES on its first line.
// So this program only ever creates the directory and copies into it;
// the grader hands it an empty /output, and that is enough.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The grader hands us an empty output directory: create it if it is not
// there yet, then fill it. Never remove it — see the header note.
mkdirSync(outDir, { recursive: true });

const appOut = join(outDir, 'app');
cpSync(join(repoRoot, 'app'), appOut, { recursive: true });

const shotsOut = join(outDir, 'screenshots');
mkdirSync(shotsOut, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsOut, { recursive: true });
}

// Gate caps from the competition (reference/gate.json): app/ at most 993
// files / 48 MiB, paths at most 1000 bytes, 3-4 screenshots at most
// 256 KiB each, dossier at most 1.5 MiB with 160 KiB of source text.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
