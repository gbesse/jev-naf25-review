# Jev NAF25 Review

**Review a French company future NAF 2025 code against sourced activity evidence and official explanatory notes.**

[![Tests](https://github.com/gbesse/jev-naf25-review/actions/workflows/test.yml/badge.svg)](https://github.com/gbesse/jev-naf25-review/actions/workflows/test.yml) [MIT](LICENSE) · Node.js 22+ · Public alpha

## Try it

```sh
git clone https://github.com/gbesse/jev-naf25-review.git
cd jev-naf25-review
npm install
npm run demo
```

The demo uses synthetic records and fixture probabilities. It makes no network call and makes no measured quality claim.

## Decision boundary

SIREN, code syntax, candidate identity and dates are checked in code. Jev evaluates only how supplied activity evidence fits one official NAF 2025 entry. Every result remains a review hypothesis.

## Upstream sources

- [https://www.insee.fr/fr/information/8181066](https://www.insee.fr/fr/information/8181066)
- [https://www.data.gouv.fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret](https://www.data.gouv.fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret)

Keep upstream attribution, original identifiers, source URLs and retrieval dates with derived records.

## Real Jev requests

Real requests are opt-in and paid. The client pins `jev-1.13.0`, validates model identity and probabilities, rejects redirects, retries only network failures plus HTTP 429/529, and refuses state above a conservative 24,000-token estimate.

```sh
TYPESAFE_API_KEY=... node scripts/live-smoke.mjs
```

Never send secrets, personal data or unredacted case files. Evaluate representative French labels before operational use.

## Validation

`npm run validate` runs syntax checks, strict public-type checks, tests and the offline demo. CI runs it on Node.js 22 and 24.

Independent project; not affiliated with TypeSafe AI or the French administration. See the [Jev API documentation](https://docs.typesafe.ai/api) and [model limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13).
