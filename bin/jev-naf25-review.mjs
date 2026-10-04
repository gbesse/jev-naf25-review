#!/usr/bin/env node
// Le défaut reste la démonstration hors ligne ; le portefeuille est explicite.
const [command, ...args] = process.argv.slice(2);
try {
  if (!command || command === "demo") await import("../examples/demo.mjs");
  else if (command === "portfolio") {
    const { runPortfolioCli } = await import("../src/portfolio-cli.mjs");
    await runPortfolioCli(args);
  } else throw new TypeError("Usage: jev-naf25-review demo | portfolio --input activities.json|csv --entries references.json [--fixtures answers.json | --live --max-decisions N] [--out report.json]");
} catch (error) {
  // Do not echo arbitrary provider, JSON parser, or input-derived errors into logs.
  if (error instanceof TypeError && error.message.startsWith("Usage:")) console.error(error.message);
  else console.error("Portfolio command failed; check inputs, budget, credentials and destination. No automatic rectification was made.");
  process.exitCode = 1;
}
