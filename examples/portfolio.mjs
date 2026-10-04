import assert from "node:assert/strict";
import { reviewPortfolio } from "../src/portfolio.mjs";
import { createFakeProvider } from "../src/jev.mjs";

const activities = [
  { siren: "123456789", description: "Conception de logiciels sur mesure", proposedCode: "62.10Z", observedAt: "2026-10-04" },
  { siren: "123456780", description: "", proposedCode: "62.10Z", observedAt: "2026-10-04" },
  { siren: "123456781", description: "Services logiciels à préciser", proposedCode: "62.10Z", observedAt: "2026-10-04" },
];
const entries = [{ code: "62.10Z", label: "Activités de programmation informatique",
  sourceUrl: "https://www.insee.fr/fr/information/8181066", retrievedAt: "2026-10-04",
  includes: ["programmation informatique"], excludes: [] }];
const provider = createFakeProvider(() => ({ model: "jev-1.13.0", answers: {
  fit: { type: "choice", choice: "possible_fit", confidence: 0.7,
    probabilities: { strong_fit: 0.2, possible_fit: 0.7, weak_fit: 0.05, insufficient_evidence: 0.05 } },
  evidence: { type: "score", score: 2, confidence: 0.8, probabilities: { 0: 0.05, 1: 0.1, 2: 0.8, 3: 0.05 } },
}, usage: {} }));
const report = await reviewPortfolio({ activities, entries, provider, maxDecisions: 1 });
assert.equal(provider.calls, 1);
assert.equal(report.counts.needs_evidence, 1);
assert.equal(report.counts.budget_deferred, 1);
assert.ok(report.rows.every(row => row.reviewRequired));
assert.ok(!JSON.stringify(report).includes("Conception de logiciels sur mesure"));
console.log(JSON.stringify({ synthetic: true, networkCalls: 0, report }, null, 2));
