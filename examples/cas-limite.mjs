// Cas limite : seuls les candidats correspondant au code proposé sont évalués par Jev.
import assert from "node:assert/strict";
import { assessNaf25 } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";

const jev = createFakeProvider(() => {
  throw new Error("Jev ne doit pas être appelé");
});
const resultat = await assessNaf25(
  {
    siren: "123456789",
    description: "Édition de logiciels",
    proposedCode: "62.10Z",
  },
  {
    code: "63.10Z",
    label: "Traitement de données",
    sourceUrl: "https://www.insee.fr/",
  },
  jev,
);
assert.equal(resultat.fit, "different_candidate");
assert.equal(jev.calls, 0);
console.log(JSON.stringify(resultat, null, 2));
