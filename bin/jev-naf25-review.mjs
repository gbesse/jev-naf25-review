#!/usr/bin/env node
import { PORTFOLIO_TEXT } from '../src/portfolio-i18n.mjs';
// Le défaut reste la démonstration hors ligne ; le portefeuille est explicite.
const [command, ...args] = process.argv.slice(2);
try {
  if (!command || command === 'demo') await import('../examples/demo.mjs');
  else if (command === 'portfolio') {
    const { runPortfolioCli } = await import('../src/portfolio-cli.mjs');
    await runPortfolioCli(args);
  } else
    throw new TypeError(
      'Usage: Utilisation / Uso: jev-naf25-review demo | portfolio --input activities.json|csv --entries references.json [--fixtures answers.json | --live --max-decisions N] [--out report.json]',
    );
} catch (error) {
  // Do not echo arbitrary provider, JSON parser, or input-derived errors into logs.
  if (error instanceof TypeError && error.message.startsWith('Usage:'))
    console.error(error.message);
  else console.error(['fr', 'en', 'es'].map((lang) => PORTFOLIO_TEXT[lang].failed).join(' / '));
  process.exitCode = 1;
}
