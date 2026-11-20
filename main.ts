// Neon Coast Cover Studio v2 — entry program (Node 22, standard library only).
//
// The app itself is plain static files under app/ (index.html + ES modules, no
// libraries, no network): a desktop browser opens it offline and it never sends a
// photo anywhere. This program only hands the entry in: it copies app/ and
// screenshots/ beside this file into the output directory and writes dossier.json,
// the summary the judge reads, with the vendored make.fun library.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.

import { cp, mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The scorer's caps: text budget for the dossier, at most 4 screenshots of at most
// 256 KiB each, at most 993 files / 48 MiB under app/, paths under 1000 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

async function requireDir(path, label) {
  const info = await stat(path);
  if (!info.isDirectory()) throw new Error(`${label} is not a directory: ${path}`);
}

await mkdir(outDir, { recursive: true });
await requireDir(join(root, "app"), "app");
await cp(join(root, "app"), join(outDir, "app"), { recursive: true });
await requireDir(join(root, "screenshots"), "screenshots");
await cp(join(root, "screenshots"), join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outDir, CAPS);
await writeFile(join(outDir, "dossier.json"), dossier);

const dossierBytes = (await stat(join(outDir, "dossier.json"))).size;
if (dossierBytes > 1572864) throw new Error(`dossier.json is ${dossierBytes} bytes, over the 1.5 MiB gate`);
console.log(`dossier.json: ${dossierBytes} bytes — app/ + screenshots/ copied to ${outDir}`);
