// Objectif : vérifier la syntaxe de chaque module JavaScript livré.
import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
const roots = ["src", "bin", "scripts", "examples", "test"];
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (path.endsWith(".mjs")) files.push(path);
  }
}
for (const root of roots) await walk(root);
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status) process.exit(result.status);
}
console.log(`Syntax checked ${files.length} modules.`);
