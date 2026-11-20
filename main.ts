// Neon Coast Cover Studio — entry point (Node 22, stdlib only).
//
// Builds the submission directory: copies app/ and screenshots/ into the
// output dir, then writes dossier.json with the kit's buildDossier. The
// output dir comes from MAKEFUN_OUTPUT_DIR, defaulting to ./out. The build
// is deterministic: same input files, same bytes out, so two runs are
// byte-identical.

import { buildDossier } from "./vendor/makefun-app.ts";
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL(".", import.meta.url).pathname;
const OUT = process.env.MAKEFUN_OUTPUT_DIR || join(ROOT, "out");

// The bounty gate, from the kit's competition.yaml: app/ at most 993 files
// and 48 MiB, each path at most 1000 bytes, index.html at most 1 MiB, 3-4
// screenshots of at most 256 KiB, dossier at most 1.5 MiB, text 160 KiB.
const CAPS = {
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from).sort()) {
    const src = join(from, name);
    const dst = join(to, name);
    if (statSync(src).isDirectory()) copyTree(src, dst);
    else cpSync(src, dst);
  }
}

function main(): void {
  const appDir = join(ROOT, "app");
  const shotsDir = join(ROOT, "screenshots");
  if (!existsSync(appDir)) throw new Error("missing app/ directory");
  if (!existsSync(shotsDir)) throw new Error("missing screenshots/ directory");
  mkdirSync(OUT, { recursive: true });
  copyTree(appDir, join(OUT, "app"));
  copyTree(shotsDir, join(OUT, "screenshots"));
  const dossier = buildDossier(OUT, CAPS);
  writeFileSync(join(OUT, "dossier.json"), dossier);
  console.log(`built ${OUT}: dossier.json ${dossier.length} bytes`);
}

main();
