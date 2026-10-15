import { nafQuestions } from './portfolio-i18n.mjs';
// Objectif : implémenter la frontière de décision métier propre au dépôt.
export const FITS = ['strong_fit', 'possible_fit', 'weak_fit', 'insufficient_evidence'];
export function nafCode(value) {
  const code = String(value ?? '')
    .trim()
    .toUpperCase();
  if (!/^\d{2}\.\d{2}[A-Z]$/.test(code)) throw new TypeError('NAF code must look like 62.10Z');
  return code;
}
export function companyActivity(input) {
  if (!/^\d{9}$/.test(String(input?.siren || '')) || !input?.description || !input?.proposedCode)
    throw new TypeError('Activity needs a 9-digit SIREN, description and proposedCode');
  return {
    siren: String(input.siren),
    description: String(input.description).trim(),
    websiteEvidence: String(input.websiteEvidence || ''),
    currentCode: input.currentCode ? nafCode(input.currentCode) : null,
    proposedCode: nafCode(input.proposedCode),
    observedAt: new Date(input.observedAt || Date.now()).toISOString(),
  };
}
export function nafEntry(input) {
  if (!input?.code || !input?.label || !input?.sourceUrl)
    throw new TypeError('NAF entry needs code, label and sourceUrl');
  return {
    code: nafCode(input.code),
    label: String(input.label),
    includes: [...(input.includes || [])].map(String),
    excludes: [...(input.excludes || [])].map(String),
    sourceUrl: String(input.sourceUrl),
    version: 'NAF2025',
  };
}
export async function assessNaf25(activityInput, entryInput, provider, { lang = 'en' } = {}) {
  const activity = companyActivity(activityInput),
    entry = nafEntry(entryInput);
  if (activity.proposedCode !== entry.code)
    return {
      fit: 'different_candidate',
      probability: 1,
      review: false,
      deterministic: true,
      activity,
      entry,
    };
  const response = await provider.decide({
    state: { activity, entry },
    questions: nafQuestions(lang),
  });
  const fit = response.answers.fit,
    evidence = response.answers.evidence;
  return {
    fit: fit.choice,
    probability: fit.probabilities[fit.choice],
    evidenceScore: evidence.score,
    confidence: Math.min(fit.confidence, evidence.confidence),
    review: true,
    deterministic: false,
    activity,
    entry,
    usage: response.usage,
  };
}
