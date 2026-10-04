import { readFile, open, lstat } from "node:fs/promises";
import { extname } from "node:path";
import { parsePortfolioCsv, reviewPortfolio } from "./portfolio.mjs";
import { createFakeProvider, createJevClient } from "./jev.mjs";

export async function runPortfolioCli(args) {
  const flags = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!["--input", "--entries", "--fixtures", "--max-decisions", "--out", "--live"].includes(key) || flags.has(key))
      throw new TypeError("Unknown or duplicate portfolio option");
    if (key === "--live") flags.set(key, true);
    else {
      const value = args[++index];
      if (!value || value.startsWith("--")) throw new TypeError("Missing portfolio option value");
      flags.set(key, value);
    }
  }
  if (!flags.has("--input") || !flags.has("--entries")) throw new TypeError("--input and --entries are required");
  if (flags.has("--live") && (flags.has("--fixtures") || !flags.has("--max-decisions")))
    throw new TypeError("--live requires explicit --max-decisions and cannot use --fixtures");
  if (flags.has("--out")) {
    try {
      await lstat(flags.get("--out"));
      throw new TypeError("Output already exists");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const inputText = await readFile(flags.get("--input"), "utf8");
  const activities = extname(flags.get("--input")).toLowerCase() === ".csv" ? parsePortfolioCsv(inputText) : JSON.parse(inputText);
  const entries = JSON.parse(await readFile(flags.get("--entries"), "utf8"));
  let provider;
  if (flags.has("--fixtures")) {
    const fixtures = JSON.parse(await readFile(flags.get("--fixtures"), "utf8"));
    provider = createFakeProvider(({ state }) => fixtures[state.activity.siren]);
  } else if (flags.has("--live")) provider = createJevClient();
  const report = await reviewPortfolio({ activities, entries, ...(provider ? { provider } : {}),
    maxDecisions: flags.has("--max-decisions") ? Number(flags.get("--max-decisions")) : 25 });
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (flags.has("--out")) {
    // Do not overwrite existing files or follow a symlink; reports can contain dossier identifiers.
    const handle = await open(flags.get("--out"), "wx", 0o600);
    try { await handle.writeFile(output, "utf8"); } finally { await handle.close(); }
  } else process.stdout.write(output);
}
