import { portfolioError } from './portfolio-i18n.mjs';
import { readFile, open, lstat, unlink } from 'node:fs/promises';
import { extname } from 'node:path';
import { parsePortfolioCsv, reviewPortfolio } from './portfolio.mjs';
import { createFakeProvider, createJevClient } from './jev.mjs';

export async function runPortfolioCli(args) {
  const flags = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (
      ![
        '--input',
        '--entries',
        '--fixtures',
        '--max-decisions',
        '--out',
        '--live',
        '--lang',
      ].includes(key) ||
      flags.has(key)
    )
      throw portfolioError();
    if (key === '--live') flags.set(key, true);
    else {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw portfolioError();
      flags.set(key, value);
    }
  }
  if (!flags.has('--input') || !flags.has('--entries')) throw portfolioError();
  if (flags.has('--live') && (flags.has('--fixtures') || !flags.has('--max-decisions')))
    throw portfolioError();
  if (flags.has('--out')) {
    try {
      await lstat(flags.get('--out'));
      throw portfolioError();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  const inputText = await readFile(flags.get('--input'), 'utf8');
  const activities =
    extname(flags.get('--input')).toLowerCase() === '.csv'
      ? parsePortfolioCsv(inputText)
      : JSON.parse(inputText);
  const entries = JSON.parse(await readFile(flags.get('--entries'), 'utf8'));
  let handle, created;
  if (flags.has('--out')) {
    handle = await open(flags.get('--out'), 'wx', 0o600);
    created = await handle.stat();
  }
  let succeeded = false;
  try {
    let provider;
    if (flags.has('--fixtures')) {
      const fixtures = JSON.parse(await readFile(flags.get('--fixtures'), 'utf8'));
      provider = createFakeProvider(({ state }) => fixtures[state.activity.siren]);
    } else if (flags.has('--live')) provider = createJevClient();
    const report = await reviewPortfolio({
      activities,
      entries,
      ...(provider ? { provider } : {}),
      maxDecisions: flags.has('--max-decisions') ? Number(flags.get('--max-decisions')) : 25,
      lang: flags.get('--lang') ?? 'fr',
    });
    const output = `${JSON.stringify(report, null, 2)}\n`;
    if (handle) await handle.writeFile(output, 'utf8');
    else process.stdout.write(output);
    succeeded = true;
  } finally {
    if (handle) {
      await handle.close();
      if (!succeeded) {
        const current = await lstat(flags.get('--out')).catch(() => null);
        if (current?.ino === created.ino && current?.dev === created.dev)
          await unlink(flags.get('--out'));
      }
    }
  }
}
