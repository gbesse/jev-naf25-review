// Revue locale de portefeuille : prévalidation complète, budget et confirmation humaine.
import { PORTFOLIO_TEXT, portfolioError } from './portfolio-i18n.mjs';
import { createHash } from 'node:crypto';
import { assessNaf25, FITS, nafCode, nafEntry } from './index.mjs';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const text = (value, field) => {
  if (value !== undefined && typeof value !== 'string') throw portfolioError();
  return (value ?? '').trim();
};
function timestamp(value, field) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}(?:$|T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$)/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw portfolioError();
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const calendar = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() + 1 !== month ||
    calendar.getUTCDate() !== day
  )
    throw portfolioError();
  return new Date(value).toISOString();
}
function officialReference(input) {
  const entry = nafEntry(input);
  const url = new URL(entry.sourceUrl);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    !(url.hostname === 'insee.fr' || url.hostname.endsWith('.insee.fr'))
  )
    throw portfolioError();
  if (
    !entry.label.trim() ||
    !Array.isArray(input.includes ?? []) ||
    !Array.isArray(input.excludes ?? [])
  )
    throw portfolioError();
  for (const notes of [input.includes ?? [], input.excludes ?? []]) {
    if (!notes.every((note) => typeof note === 'string' && note.trim())) throw portfolioError();
  }
  return {
    ...entry,
    sourceUrl: url.href,
    retrievedAt: timestamp(input.retrievedAt, 'reference.retrievedAt'),
  };
}
function prepareActivity(input) {
  if (!input || typeof input.siren !== 'string' || !/^\d{9}$/.test(input.siren))
    throw portfolioError();
  return {
    siren: input.siren,
    description: text(input.description, 'description'),
    websiteEvidence: text(input.websiteEvidence, 'websiteEvidence'),
    currentCode: input.currentCode ? nafCode(input.currentCode) : null,
    proposedCode: input.proposedCode ? nafCode(input.proposedCode) : null,
    observedAt: timestamp(input.observedAt, 'activity.observedAt'),
  };
}
const priorities = {
  needs_evidence: 0,
  missing_code: 0,
  missing_reference: 0,
  provider_error: 0,
  insufficient_evidence: 0,
  weak_fit: 1,
  possible_fit: 2,
  budget_deferred: 2,
  not_assessed: 2,
  strong_fit: 3,
};
function questions(status, evidenceScore, lang) {
  const q = PORTFOLIO_TEXT[lang].questions;
  const result = [];
  if (status === 'missing_code') result.push(q[0]);
  if (status === 'missing_reference') result.push(q[1]);
  if (
    ['needs_evidence', 'insufficient_evidence'].includes(status) ||
    (evidenceScore !== null && evidenceScore < 2)
  )
    result.push(q[2]);
  if (['weak_fit', 'possible_fit', 'strong_fit'].includes(status)) result.push(q[3]);
  if (['budget_deferred', 'not_assessed', 'provider_error'].includes(status)) result.push(q[4]);
  return result;
}

/** No provider is created implicitly, and all input validation finishes before any call. */
export async function reviewPortfolio({
  activities,
  entries,
  provider,
  maxDecisions = 25,
  lang = 'fr',
} = {}) {
  if (!Object.hasOwn(PORTFOLIO_TEXT, lang)) throw portfolioError();
  if (!Array.isArray(activities) || !Array.isArray(entries)) throw portfolioError();
  if (!Number.isSafeInteger(maxDecisions) || maxDecisions < 0) throw portfolioError();
  if (provider !== undefined && typeof provider?.decide !== 'function') throw portfolioError();
  const prepared = activities.map(prepareActivity);
  if (new Set(prepared.map((row) => row.siren)).size !== prepared.length) throw portfolioError();
  const references = entries.map(officialReference);
  if (new Set(references.map((row) => row.code)).size !== references.length) throw portfolioError();
  const byCode = new Map(references.map((entry) => [entry.code, entry]));
  let attemptedDecisions = 0,
    completedDecisions = 0,
    failedDecisions = 0;
  const rows = [];
  for (const activity of prepared) {
    const entry = byCode.get(activity.proposedCode);
    const base = {
      siren: activity.siren,
      currentCode: activity.currentCode,
      proposedCode: activity.proposedCode,
      observedAt: activity.observedAt,
      reviewRequired: true,
      evidenceFingerprint: hash([
        activity.description,
        activity.websiteEvidence,
        activity.observedAt,
      ]),
      reference: entry
        ? {
            code: entry.code,
            label: entry.label,
            sourceUrl: entry.sourceUrl,
            retrievedAt: entry.retrievedAt,
            fingerprint: hash(entry),
          }
        : null,
    };
    let status,
      evidenceScore = null,
      probability = null,
      confidence = null;
    if (!activity.proposedCode) status = 'missing_code';
    else if (!activity.description) status = 'needs_evidence';
    else if (!entry) status = 'missing_reference';
    else if (!provider) status = 'not_assessed';
    else if (attemptedDecisions >= maxDecisions) status = 'budget_deferred';
    else {
      attemptedDecisions += 1;
      try {
        const result = await assessNaf25(activity, entry, provider, { lang });
        if (
          !FITS.includes(result.fit) ||
          !Number.isFinite(result.evidenceScore) ||
          result.evidenceScore < 0 ||
          result.evidenceScore > 3 ||
          !Number.isFinite(result.probability) ||
          result.probability < 0 ||
          result.probability > 1 ||
          !Number.isFinite(result.confidence) ||
          result.confidence < 0 ||
          result.confidence > 1
        )
          throw new Error('Invalid portfolio assessment');
        status = result.fit;
        evidenceScore = result.evidenceScore;
        probability = result.probability;
        confidence = result.confidence;
        completedDecisions += 1;
      } catch {
        // Provider error messages may contain customer state or credentials; never export them.
        status = 'provider_error';
        failedDecisions += 1;
      }
    }
    rows.push({
      ...base,
      status,
      priority: evidenceScore !== null && evidenceScore < 2 ? 0 : priorities[status],
      evidenceScore,
      probability,
      confidence,
      questions: questions(status, evidenceScore, lang),
    });
  }
  rows.sort((a, b) => a.priority - b.priority || a.siren.localeCompare(b.siren));
  const counts = {};
  for (const row of rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  return {
    schemaVersion: 1,
    referenceVersion: 'NAF2025',
    mode: provider ? 'assessment' : 'preflight-only',
    inputFingerprint: hash({ activities: prepared, entries: references }),
    budget: {
      maxDecisions,
      attemptedDecisions,
      completedDecisions,
      failedDecisions,
      remainingDecisions: maxDecisions - attemptedDecisions,
    },
    total: rows.length,
    counts,
    rows,
  };
}

/** RFC4180-style CSV with quoted multiline fields, UTF-8 BOM, and strict row widths. */
export function parsePortfolioCsv(source) {
  if (typeof source !== 'string') throw portfolioError();
  const input = source.replace(/^\uFEFF/, '');
  const records = [];
  let row = [],
    field = '',
    quoted = false,
    afterQuote = false;
  function endField() {
    row.push(field);
    field = '';
    afterQuote = false;
  }
  function endRow() {
    endField();
    records.push(row);
    row = [];
  }
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        afterQuote = true;
      } else field += char;
    } else if (char === ',') endField();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[index + 1] === '\n') index += 1;
      endRow();
    } else if (char === '"' && !field && !afterQuote) quoted = true;
    else {
      if (afterQuote || char === '"') throw portfolioError();
      field += char;
    }
  }
  if (quoted) throw portfolioError();
  if (field || row.length || afterQuote) endRow();
  const headers = records.shift();
  const allowed = [
    'siren',
    'description',
    'websiteEvidence',
    'currentCode',
    'proposedCode',
    'observedAt',
  ];
  if (
    !headers?.length ||
    new Set(headers).size !== headers.length ||
    headers.some((header) => !allowed.includes(header)) ||
    !['siren', 'description', 'proposedCode', 'observedAt'].every((header) =>
      headers.includes(header),
    )
  )
    throw portfolioError();
  return records.map((values) => {
    if (values.length !== headers.length) throw portfolioError();
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}
