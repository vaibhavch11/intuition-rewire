#!/usr/bin/env node
// Writes src/lib/dsa/authored-lessons.json: every lesson with a committed
// content file in content/lessons. The sitemap lists these even when the R2
// listing (its source of last-modified dates) fails or comes back short.
// Runs before every build (the "prebuild" script).
import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "content", "lessons");
const lessons = [];
for (const section of readdirSync(root).sort()) {
  const dir = path.join(root, section);
  if (!statSync(dir).isDirectory()) continue;
  for (const file of readdirSync(dir).sort()) {
    if (file.endsWith(".json")) lessons.push(`${section}/${file.slice(0, -".json".length)}`);
  }
}
writeFileSync(path.join(process.cwd(), "src", "lib", "dsa", "authored-lessons.json"), `${JSON.stringify(lessons, null, 1)}\n`);
console.log(`authored-lessons.json: ${lessons.length} lessons`);
