import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { reviewPortfolio, parsePortfolioCsv } from '../src/portfolio.mjs';

const activity = {
  siren: '123456789',
  description: 'CUSTOMER-EVIDENCE-DO-NOT-EXPORT',
  proposedCode: '62.10Z',
  observedAt: '2026-10-04',
};
const entry = {
  code: '62.10Z',
  label: 'Programmation',
  sourceUrl: 'https://www.insee.fr/fr/information/8181066',
  retrievedAt: '2026-10-04',
};
function provider({ choice = 'strong_fit', score = 3, fail = false } = {}) {
  return {
    calls: 0,
    async decide() {
      this.calls += 1;
      if (fail) throw new Error('SECRET-KEY-CUSTOMER-STATE');
      return {
        answers: {
          fit: { choice, probabilities: { [choice]: 0.9 }, confidence: 0.9 },
          evidence: { score, confidence: 0.8 },
        },
        usage: { confidential: 'DO-NOT-EXPORT-USAGE' },
      };
    },
  };
}

test('preflight is offline and exports fingerprints, not customer evidence', async () => {
  const report = await reviewPortfolio({ activities: [activity], entries: [entry] });
  assert.equal(report.mode, 'preflight-only');
  assert.equal(report.budget.attemptedDecisions, 0);
  assert.equal(report.rows[0].status, 'not_assessed');
  assert.equal(report.rows[0].reference.retrievedAt, '2026-10-04T00:00:00.000Z');
  assert.ok(!JSON.stringify(report).includes(activity.description));
});

test('logical decision budget is hard and strong fits still need human review', async () => {
  const p = provider();
  const report = await reviewPortfolio({
    activities: [activity, { ...activity, siren: '123456780' }],
    entries: [entry],
    provider: p,
    maxDecisions: 1,
  });
  assert.equal(p.calls, 1);
  assert.equal(report.counts.strong_fit, 1);
  assert.equal(report.counts.budget_deferred, 1);
  assert.ok(report.rows.every((row) => row.reviewRequired));
  assert.ok(!JSON.stringify(report).includes('DO-NOT-EXPORT-USAGE'));
});

test('all identifiers, references and dates validate before the first call', async () => {
  const p = provider();
  const badActivities = [
    [activity, { ...activity, siren: 'bad' }],
    [activity, activity],
    [{ ...activity, observedAt: 'bad' }],
    [{ ...activity, description: {} }],
    [{ ...activity, observedAt: '2026-02-30' }],
    [{ ...activity, observedAt: '0' }],
  ];
  for (const activities of badActivities)
    await assert.rejects(() => reviewPortfolio({ activities, entries: [entry], provider: p }));
  for (const sourceUrl of [
    'https://insee.fr.evil.test',
    'http://insee.fr',
    'https://user:password@insee.fr',
    'https://insee.fr:8443',
  ])
    await assert.rejects(() =>
      reviewPortfolio({ activities: [activity], entries: [{ ...entry, sourceUrl }], provider: p }),
    );
  await assert.rejects(() =>
    reviewPortfolio({
      activities: [activity],
      entries: [{ ...entry, retrievedAt: 'bad' }],
      provider: p,
    }),
  );
  await assert.rejects(() =>
    reviewPortfolio({ activities: [activity], entries: [entry, entry], provider: p }),
  );
  assert.equal(p.calls, 0);
});

test('missing evidence, code and reference bypass the provider', async () => {
  const p = provider();
  const report = await reviewPortfolio({
    activities: [
      { ...activity, description: '   ' },
      { ...activity, siren: '123456780', proposedCode: '' },
      { ...activity, siren: '123456781', proposedCode: '63.10Z' },
    ],
    entries: [entry],
    provider: p,
  });
  assert.deepEqual(report.counts, { needs_evidence: 1, missing_code: 1, missing_reference: 1 });
  assert.equal(p.calls, 0);
  assert.ok(report.rows.every((row) => row.questions.length > 0));
});

test('provider errors consume budget without exposing secrets or implying success', async () => {
  const p = provider({ fail: true });
  const report = await reviewPortfolio({
    activities: [activity, { ...activity, siren: '123456780' }],
    entries: [entry],
    provider: p,
    maxDecisions: 1,
  });
  assert.equal(report.budget.failedDecisions, 1);
  assert.equal(report.budget.completedDecisions, 0);
  assert.equal(report.counts.provider_error, 1);
  assert.equal(report.counts.budget_deferred, 1);
  assert.ok(!JSON.stringify(report).includes('SECRET-KEY'));
});

test('invalid assessments fail closed; thin evidence is prioritized even with strong fit', async () => {
  const bad = await reviewPortfolio({
    activities: [activity],
    entries: [entry],
    provider: provider({ score: 99 }),
  });
  assert.equal(bad.rows[0].status, 'provider_error');
  const thin = await reviewPortfolio({
    activities: [activity],
    entries: [entry],
    provider: provider({ score: 1 }),
  });
  assert.equal(thin.rows[0].priority, 0);
  assert.ok(thin.rows[0].questions.some((question) => question.includes('concrètement')));
  for (const maxDecisions of [-1, 0.2, NaN, Infinity])
    await assert.rejects(() => reviewPortfolio({ activities: [], entries: [], maxDecisions }));
  assert.equal(
    (
      await reviewPortfolio({
        activities: [activity],
        entries: [entry],
        provider: provider(),
        maxDecisions: 0,
      })
    ).rows[0].status,
    'budget_deferred',
  );
});

test('CSV handles BOM, escaped quotes, multiline evidence, CRLF and empty cells', () => {
  const csv =
    '\uFEFFsiren,description,proposedCode,observedAt\r\n123456789,"Logiciel, dit ""alpha""\nactivité",62.10Z,2026-10-04\r\n123456780,,62.10Z,2026-10-04\r\n';
  const rows = parsePortfolioCsv(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].description, 'Logiciel, dit "alpha"\nactivité');
  assert.equal(rows[1].description, '');
});

test('CSV rejects unknown/duplicate headers, unclosed quotes and inconsistent widths', () => {
  for (const input of [
    'siren,siren\na,b',
    'unknown\na',
    'siren,description,proposedCode,observedAt\na,b,c',
    'siren,description,proposedCode,observedAt\na,"b,c,d',
    'siren,description,proposedCode,observedAt\na,"b"x,c,d',
  ])
    assert.throws(() => parsePortfolioCsv(input));
});

test('CLI preflight writes a private report and refuses existing files or implicit live mode', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'naf-portfolio-'));
  const input = join(dir, 'activities.json'),
    refs = join(dir, 'entries.json'),
    out = join(dir, 'report.json');
  await writeFile(input, JSON.stringify([activity]));
  await writeFile(refs, JSON.stringify([entry]));
  const args = [
    'bin/jev-naf25-review.mjs',
    'portfolio',
    '--input',
    input,
    '--entries',
    refs,
    '--out',
    out,
  ];
  const first = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(first.status, 0, first.stderr);
  assert.equal((await stat(out)).mode & 0o777, 0o600);
  const saved = await readFile(out, 'utf8');
  assert.equal(JSON.parse(saved).mode, 'preflight-only');
  assert.equal(spawnSync(process.execPath, args).status, 1);
  assert.equal(await readFile(out, 'utf8'), saved);
  assert.equal(spawnSync(process.execPath, [...args, '--live']).status, 1);
});

test('generated review questions and semantic instructions support FR/EN/ES without translating evidence', async () => {
  const questions = new Set(),
    prompts = new Set();
  for (const lang of ['fr', 'en', 'es']) {
    const p = provider();
    const decide = p.decide.bind(p);
    p.decide = async (payload) => {
      assert.equal(payload.state.activity.description, activity.description);
      prompts.add(payload.questions.fit.instructions);
      return decide(payload);
    };
    const r = await reviewPortfolio({
      activities: [activity],
      entries: [entry],
      provider: p,
      lang,
    });
    questions.add(r.rows[0].questions.join());
    assert.equal(r.rows[0].reference.label, entry.label);
  }
  assert.equal(questions.size, 3);
  assert.equal(prompts.size, 3);
  const p = provider();
  await assert.rejects(
    reviewPortfolio({ activities: [activity], entries: [entry], provider: p, lang: 'de' }),
  );
  assert.equal(p.calls, 0);
});

test('CLI failure cleans its reserved output and remains localized', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'naf-error-'));
  const input = join(dir, 'activities.json'),
    refs = join(dir, 'entries.json'),
    out = join(dir, 'report.json');
  await writeFile(input, JSON.stringify([{ ...activity, observedAt: 'bad' }]));
  await writeFile(refs, JSON.stringify([entry]));
  const r = spawnSync(
    process.execPath,
    [
      'bin/jev-naf25-review.mjs',
      'portfolio',
      '--input',
      input,
      '--entries',
      refs,
      '--out',
      out,
      '--lang',
      'es',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Comando fallido/);
  await assert.rejects(stat(out));
});

test('fractional TypeSafe Score remains valid and low evidence stays prioritized', async () => {
  const p = provider({ score: 1.5 });
  const r = await reviewPortfolio({ activities: [activity], entries: [entry], provider: p });
  assert.equal(r.rows[0].status, 'strong_fit');
  assert.equal(r.rows[0].evidenceScore, 1.5);
  assert.equal(r.rows[0].priority, 0);
  assert.equal(r.rows[0].reviewRequired, true);
});

test('non-text reference notes are rejected before a provider call', async () => {
  const p = provider();
  await assert.rejects(
    reviewPortfolio({
      activities: [activity],
      entries: [{ ...entry, includes: [{}] }],
      provider: p,
    }),
  );
  await assert.rejects(
    reviewPortfolio({
      activities: [activity],
      entries: [{ ...entry, excludes: [''] }],
      provider: p,
    }),
  );
  assert.equal(p.calls, 0);
});
