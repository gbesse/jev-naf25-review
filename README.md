# Jev NAF25 Review

**Vérifie le futur code NAF 2025 d’une entreprise à partir de preuves d’activité et des notes officielles.**

[![Tests](https://github.com/gbesse/jev-naf25-review/actions/workflows/test.yml/badge.svg)](https://github.com/gbesse/jev-naf25-review/actions/workflows/test.yml) [MIT](LICENSE) · Node.js 22+ · v0.1.4 · Documentation française

Le dépôt confronte l’activité principale observée, le futur code proposé dans Sirene et une rubrique officielle de la NAF 2025. Il produit une hypothèse d’adéquation et un niveau de preuve.

## Démarrage rapide

```sh
git clone https://github.com/gbesse/jev-naf25-review.git
cd jev-naf25-review
npm install
npm run demo
```

La démonstration utilise uniquement des données et probabilités synthétiques. Elle n’effectue aucun appel réseau et ne constitue pas une mesure de qualité de Jev.

## Exemple exécutable

Cet exemple vérifie un code NAF 2025 proposé pour un éditeur de logiciels. Il utilise un fournisseur Jev simulé : aucune clé API ni connexion réseau n’est nécessaire. L’assertion intégrée fait échouer la commande si le comportement attendu change.

Le code complet de [`examples/demo.mjs`](examples/demo.mjs) est directement copiable :

```js
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
```

Lancez-le avec :

```sh
npm run demo:principal
```

Résultat à repérer : `fit: possible_fit`.

### Cas limite à tester

Un code candidat différent du code proposé est écarté sans modèle. Le code se trouve dans [`examples/cas-limite.mjs`](examples/cas-limite.mjs).

```sh
npm run demo:limite
```

Résultat à repérer : `fit: different_candidate · appels Jev: 0`. La commande `npm run demo` exécute les deux exemples.

## Utilisation de la bibliothèque

Importez les fonctions métier depuis `@gbesse/jev-naf25-review`. Fournissez soit `createJevClient()` depuis l’export `./jev`, soit `createFakeProvider()` pour les tests hors ligne.

Les noms de l’API JavaScript restent stables pour préserver la compatibilité avec les versions précédentes. La documentation, les exemples et les explications destinées aux utilisateurs sont en français.

## Frontière de décision

Le SIREN, la syntaxe du code, l’identité du candidat et les dates sont vérifiés dans le code. Jev évalue uniquement l’adéquation des preuves fournies à une rubrique officielle. Chaque résultat reste à examiner.

La question exacte envoyée à Jev est versionnée dans [`src/index.mjs`](src/index.mjs). Les identifiants, dates, calculs, filtres, seuils et transitions d’état restent gérés par du code ordinaire.

## Sources

- [https://www.insee.fr/fr/information/8181066](https://www.insee.fr/fr/information/8181066)
- [https://www.data.gouv.fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret](https://www.data.gouv.fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret)

Conservez l’attribution amont, les identifiants d’origine, les URL de source et les dates de récupération avec chaque enregistrement dérivé.

## Appels Jev réels

Les appels réels sont facultatifs et payants. Le client fixe le modèle `jev-1.13.0`, valide l’identité du modèle et toutes les probabilités, refuse les redirections, ne retente que les erreurs réseau et les réponses HTTP 429/529, puis bloque les requêtes dépassant une estimation prudente de 24 000 jetons.

```sh
TYPESAFE_API_KEY=... node scripts/live-smoke.mjs
```

N’envoyez jamais de secret, de donnée personnelle ni de dossier sensible non expurgé. Évaluez le comportement sur un jeu représentatif de cas français avant tout usage opérationnel.

## Parcours comparatif

`npm run demo:parcours` produit un rapport JSON partageable pour **jev-naf25-review** : le scénario principal et la frontière déterministe. Chaque scénario garde sa sortie propre et échoue si son assertion ne passe plus. Les données et probabilités sont synthétiques ; aucun appel Jev n’est effectué.

Cette vue permet de comparer rapidement les chemins de décision et de choisir quel exemple adapter à vos propres données sourcées.

## Validation

```sh
npm run check
npm run typecheck
npm test
npm run demo
```

La CI exécute ces vérifications sous Node.js 22 et 24.

Projet indépendant, sans affiliation avec TypeSafe AI ni avec l’administration française. Consultez la [documentation de l’API Jev](https://docs.typesafe.ai/api) et les [limites du modèle](https://docs.typesafe.ai/model-jaggedness/jev-1.13).
