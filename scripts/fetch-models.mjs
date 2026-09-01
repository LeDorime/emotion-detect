// Downloads the face-api model weights this app uses into public/models/.
// The weights are small (~0.5 MB total) and committed to the repo, so this
// only needs to run when bumping @vladmandic/face-api or refreshing them.
//
// Usage: npm run fetch-models

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const FACE_API_VERSION = require("../package.json").dependencies[
  "@vladmandic/face-api"
].replace(/^[^0-9]*/, "");

const BASE = `https://cdn.jsdelivr.net/npm/@vladmandic/face-api@${FACE_API_VERSION}/model`;

const FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model.bin",
  "face_expression_model-weights_manifest.json",
  "face_expression_model.bin",
];

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "models");

await mkdir(outDir, { recursive: true });

let total = 0;
for (const name of FILES) {
  const url = `${BASE}/${name}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ ${name} — HTTP ${res.status} from ${url}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(outDir, name), buf);
  total += buf.byteLength;
  console.log(`✓ ${name} (${(buf.byteLength / 1024).toFixed(1)} KB)`);
}

console.log(
  `\nSaved ${FILES.length} files (${(total / 1024).toFixed(1)} KB) to public/models/`,
);
