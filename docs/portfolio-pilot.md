# NAF25 Portfolio Review : première passe

La [page officielle Insee](https://www.insee.fr/fr/information/8181066) annonce
l'application des nouveaux codes APE au 1er janvier 2027 et leur consultation /
rectification pendant 2026. Cet outil aide à organiser la **revue** d'un portefeuille,
pas à attribuer un code ni à conclure sur ses conséquences juridiques.

## Entrées et lancement

Un tableau JSON ou un CSV avec les colonnes `siren,description,proposedCode,observedAt`.
Colonnes facultatives : `currentCode,websiteEvidence`. Les descriptions vides et les
codes proposés absents restent dans la file de revue, sans appel. Les SIREN sont des
chaînes de neuf chiffres : la syntaxe est vérifiée, pas leur existence dans Sirene.
Dates explicites obligatoires ; conserver l'export Sirene d'origine séparément.

Les références sont un tableau JSON de rubriques : `code,label,sourceUrl,retrievedAt`
et, facultativement, `includes,excludes`. Une URL HTTPS Insee est requise. L'outil
ne télécharge pas cette URL et ne prouve pas l'authenticité du contenu fourni ;
vérifier sa correspondance avec les notes officielles avant le pilote.

```sh
npm run demo:portfolio
node bin/jev-naf25-review.mjs portfolio --input portefeuille.csv --entries rubriques.json --out rapport.json
```

Ce lancement fait **zéro appel réseau**, même si une clé est présente dans
l'environnement. Il produit un précontrôle et des questions à résoudre.
`--fixtures reponses.json` active un fournisseur synthétique ; les réponses sont
indexées par SIREN et doivent suivre le format Jev. Ce n'est pas un benchmark.

Pour un usage réel explicitement autorisé, `--live --max-decisions N` est obligatoire.
La clé reste dans un environnement local ignoré par Git ; ne jamais la passer en
argument. Le budget compte les décisions logiques, erreurs comprises : le transport
existant peut tenter **jusqu'à trois requêtes HTTP par décision**. Ce n'est donc
pas un plafond en euros. Aucun appel réel n'a été nécessaire à cette première passe.

## Rapport et frontières

Tous les dossiers restent `reviewRequired: true`, même un `strong_fit`. Les preuves
insuffisantes passent avant les adéquations apparentes. Les résultats peuvent être
`missing_code`, `needs_evidence`, `missing_reference`, `not_assessed`,
`budget_deferred`, `provider_error`, ou un des quatre niveaux d'adéquation existants.
Une erreur fournisseur consomme le budget et n'est pas présentée comme une réussite.

Le JSON inclut codes, SIREN, dates et empreintes des preuves / références, mais ni
description d'activité, ni preuve du site, ni message d'erreur fournisseur. Ces
identifiants restent potentiellement sensibles. `--out` crée un fichier `600` et
refuse une destination déjà existante, y compris un lien symbolique. Sans `--out`,
le JSON va vers stdout : éviter les journaux partagés.

Il n'y a ni navigateur de revue multi-utilisateur, ni récupération Sirene intégrée,
ni envoi de rectification. Le plafond, l'import CSV et les références sont validés
avant le premier appel. Aucune probabilité n'est présentée comme calibrée sur des
dossiers réels.

## Validation du produit (objectifs non atteints à ce stade)

Commencer avec un cabinet et 100 dossiers dont les cas ambigus sont annotés par
un responsable, puis comparer temps de revue et erreurs de priorité avec la
consultation officielle seule. Conserver un lot indépendant pour la validation.
Le service officiel est gratuit : l'offre payante doit démontrer un gain sur le
traitement du portefeuille, pas monétiser la consultation d'un code.

Décision de poursuite : au moins un pilote payé et une économie de temps constatée
sans perte de qualité métier. Risques : fenêtre courte et faible nombre de dossiers
réellement ambigus. Aucune prospection n'est incluse ni effectuée.

## Langues et publication — FR

`--lang fr|en|es` ou `reviewPortfolio({ ..., lang })` choisit les questions de revue et les instructions générées, jamais la langue des descriptions utilisateur. Les erreurs de validation et du CLI sont disponibles dans les trois langues. `--out` réserve le nouveau fichier privé avant création du fournisseur et traitement ; une erreur retire seulement ce fichier créé, sans écraser une destination existante. Cette version est un pilote technique publié, pas un pilote terrain validé.

## English — Portfolio review pilot

The [official Insee page](https://www.insee.fr/fr/information/8181066) describes APE codes changing on January 1, 2027 and consultation/rectification during 2026. This tool organizes a review; it neither assigns codes nor infers legal consequences.

Input: JSON activities or strict CSV with `siren,description,proposedCode,observedAt`; optional `currentCode,websiteEvidence`. Missing descriptions/codes remain queued without a provider call. SIREN is checked as nine digits, not verified against Sirene. References require `code,label,sourceUrl,retrievedAt` with optional `includes,excludes`, real dates and HTTPS Insee URLs. The tool does not fetch URLs or authenticate supplied notes. Keep dated source exports separately and verify the actual official entry yourself.

The default CLI performs zero network calls. `--fixtures` uses caller-supplied synthetic answers indexed by SIREN. Live use requires explicit `--live --max-decisions N`; keys stay in private ignored environment files. Budgets count logical decisions, including failures; the existing client can make up to three HTTP attempts per decision, so this is not a money ceiling. No live call was needed for this release.

Every row requires human review, even `strong_fit`. Thin evidence, missing references, provider failures and budget-deferred cases are prioritized. Reports contain IDs, codes, dates and evidence/reference hashes, never raw customer evidence or provider error bodies. IDs may remain sensitive. `--out` reserves a new private mode-600 file before creating the provider and processing; existing files and symlinks are refused. On failure only that created file is removed. Without `--out`, output goes to stdout. `--lang fr|en|es` or library `lang` selects generated questions and prompts without translating user data.

```sh
npm run demo:portfolio -- en
node bin/jev-naf25-review.mjs portfolio --input portfolio.csv --entries entries.json --out report.json --lang en
```

No multi-user review UI, Sirene retrieval or rectification submission is included. Probabilities are not calibrated against real dossiers. Next validation, not achieved here: a cabinet pilot with independently annotated cases, measured review time and priority errors compared with the free official consultation; retain an independent holdout. Commercial value remains unproven and no outreach was performed.

## Español — Piloto de revisión de portafolio

La [página oficial Insee](https://www.insee.fr/fr/information/8181066) describe cambios APE el 1 de enero de 2027 y consulta/rectificación durante 2026. La herramienta organiza una revisión; no asigna códigos ni deduce consecuencias jurídicas.

Entrada: actividades JSON o CSV estricto `siren,description,proposedCode,observedAt`; opcionales `currentCode,websiteEvidence`. Descripciones/códigos ausentes quedan pendientes sin llamada. Se comprueban nueve dígitos SIREN, no su existencia en Sirene. Referencias: `code,label,sourceUrl,retrievedAt` y opcionales `includes,excludes`, fechas reales y URL HTTPS Insee. No se descargan URL ni autentican notas suministradas. Conserve exportaciones fechadas y verifique la rúbrica oficial.

El CLI predeterminado no realiza llamadas. `--fixtures` usa respuestas sintéticas del usuario indexadas por SIREN. Modo real exige `--live --max-decisions N`; claves en un entorno privado ignorado por Git. El presupuesto cuenta decisiones lógicas, incluidos errores; el cliente puede hacer hasta tres intentos HTTP por decisión, no es un límite monetario. Esta publicación no necesitó llamadas reales.

Cada fila exige revisión humana incluso con `strong_fit`. Se priorizan pruebas insuficientes, referencias ausentes, errores y casos diferidos por presupuesto. Informes con identificadores, códigos, fechas y hashes, sin pruebas textuales ni errores del proveedor. Los identificadores pueden ser sensibles. `--out` reserva un archivo nuevo privado 600 antes de crear el proveedor y procesar; rechaza archivos y enlaces existentes. Ante un fallo solo elimina ese archivo creado. Sin `--out`, escribe stdout. `--lang fr|en|es` o `lang` de biblioteca elige preguntas e instrucciones generadas sin traducir datos del usuario.

```sh
npm run demo:portfolio -- es
node bin/jev-naf25-review.mjs portfolio --input portafolio.csv --entries rubricas.json --out informe.json --lang es
```

Sin interfaz multiusuario, descarga Sirene ni envío de rectificación. Probabilidades no calibradas con expedientes reales. Validación futura aún no realizada: piloto con un gabinete, casos anotados independientemente, tiempo y errores de prioridad comparados con la consulta oficial gratuita y un holdout independiente. Valor comercial no demostrado; sin contactos comerciales.

FR : `evidenceScore` conserve les valeurs fractionnaires entre 0 et 3 ; EN: `evidenceScore` retains fractional values between 0 and 3; ES: `evidenceScore` conserva valores fraccionarios entre 0 y 3. [TypeSafe Score](https://docs.typesafe.ai/primitives/score).
