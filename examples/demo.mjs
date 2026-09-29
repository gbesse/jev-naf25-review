// Objectif : démontrer la frontière de décision sans appel réseau.
import assert from "node:assert/strict";
import { assessNaf25 } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";
const provider = createFakeProvider(() => ({
  model: "jev-1.13.0",
  answers: {
    fit: {
      type: "choice",
      choice: "possible_fit",
      probabilities: {
        strong_fit: 0.25,
        possible_fit: 0.65,
        weak_fit: 0.05,
        insufficient_evidence: 0.05,
      },
      confidence: 0.65,
    },
    evidence: {
      type: "score",
      score: 2,
      probabilities: { 0: 0.02, 1: 0.08, 2: 0.82, 3: 0.08 },
      confidence: 0.82,
    },
  },
  usage: { input_tokens: 50, output_tokens: 0 },
}));
const resultat = await assessNaf25(
  {
    siren: "123456789",
    description: "Édition de logiciels de gestion en ligne",
    proposedCode: "62.10Z",
    observedAt: "2026-09-29",
  },
  {
    code: "62.10Z",
    label: "Activités de programmation informatique",
    includes: ["développement de logiciels"],
    sourceUrl: "https://www.insee.fr/fr/information/8617910",
  },
  provider,
);
assert.equal(resultat.fit, "possible_fit");
console.log(JSON.stringify(resultat, null, 2));
