#!/usr/bin/env node
// Uploads content/lessons/**/*.json — and content/curriculum.json, the
// chapters and lessons added or removed in /admin — into the R2 bucket,
// skipping any key that already exists there. Run this after authoring new
// lessons locally and committing them, so the deployed site (which reads
// lesson content from R2, not the filesystem) picks them up. Never overwrites
// an existing key — a lesson or course edited live via /admin on the deployed
// site takes priority over whatever is committed to git.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const BUCKET = "intuition-rewire-storage";
const ROOT = path.join(process.cwd(), "content", "lessons");
const WRANGLER = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "wrangler.cmd" : "wrangler"
);

function run(args) {
  // Windows' .cmd shims require shell interpretation to spawn at all; every
  // argument here is either a fixed literal or a filename read straight off
  // local disk, never untrusted/external input.
  return execFileSync(WRANGLER, args, { stdio: "pipe", shell: process.platform === "win32" });
}

function existsInBucket(key) {
  try {
    run(["r2", "object", "get", `${BUCKET}/${key}`, "--remote", "--pipe"]);
    return true;
  } catch {
    return false;
  }
}

function upload(key, filePath) {
  run([
    "r2",
    "object",
    "put",
    `${BUCKET}/${key}`,
    "--file",
    filePath,
    "--content-type",
    "application/json",
    "--remote",
  ]);
}

let uploaded = 0;
let skipped = 0;

for (const section of readdirSync(ROOT)) {
  const sectionDir = path.join(ROOT, section);
  if (!statSync(sectionDir).isDirectory()) continue;

  for (const file of readdirSync(sectionDir)) {
    if (!file.endsWith(".json")) continue;
    const key = `lessons/${section}/${file}`;

    if (existsInBucket(key)) {
      skipped++;
      continue;
    }

    upload(key, path.join(sectionDir, file));
    uploaded++;
    console.log(`seeded ${key}`);
  }
}

const CURRICULUM = path.join(process.cwd(), "content", "curriculum.json");
if (existsSync(CURRICULUM)) {
  if (existsInBucket("curriculum.json")) {
    skipped++;
  } else {
    upload("curriculum.json", CURRICULUM);
    uploaded++;
    console.log("seeded curriculum.json");
  }
}

console.log(
  `\nDone. Uploaded ${uploaded}, skipped ${skipped} (already in R2 — treated as authoritative over the committed baseline).`
);
