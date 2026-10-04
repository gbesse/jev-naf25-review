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
