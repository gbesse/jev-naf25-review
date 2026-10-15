export const PORTFOLIO_TEXT = {
  fr: {
    invalid: 'Données, options ou dates du portefeuille invalides.',
    failed:
      'Échec de la commande : vérifiez les entrées, le budget, les accès et la destination. Aucune rectification automatique.',
    questions: [
      'Quel futur code APE figure dans la source Sirene datée ?',
      'Quelle rubrique officielle et quelle version des notes correspondent au code proposé ?',
      'Quels produits ou services établissent concrètement l’activité principale ?',
      'Les inclusions et exclusions de la rubrique ont-elles été vérifiées par le responsable du dossier ?',
      'Faut-il examiner ce dossier manuellement ou autoriser une nouvelle évaluation bornée ?',
    ],
    fit: 'Évaluez si l’activité productive principale étayée correspond à cette rubrique NAF 2025. Utilisez insufficient_evidence si les preuves n’établissent pas l’activité principale. Ne déduisez aucune conséquence juridique.',
    options: [
      'Les preuves correspondent à la rubrique sans exclusion',
      'Correspondance plausible avec ambiguïté importante',
      'Vocabulaire commun mais activité principale différente',
      'Preuves insuffisantes pour classer',
    ],
    evidence:
      'Évaluez la force des preuves concrètes d’activité, pas la confiance dans l’entreprise.',
    levels: [
      '0 — aucune preuve utilisable',
      '1 — description générique',
      '2 — produits ou services concrets',
      '3 — activité principale et exclusions examinées',
    ],
  },
  en: {
    invalid: 'Invalid portfolio data, options or dates.',
    failed:
      'Command failed: check inputs, budget, credentials and destination. No automatic rectification.',
    questions: [
      'Which future APE code appears in the dated Sirene source?',
      'Which official entry and version of the notes match the proposed code?',
      'Which products or services establish the principal activity concretely?',
      'Has the dossier owner checked the entry’s inclusions and exclusions?',
      'Should this dossier be reviewed manually or receive another bounded assessment?',
    ],
    fit: 'Assess whether the evidenced principal productive activity fits this NAF 2025 entry. Use insufficient_evidence when evidence does not establish the principal activity. Infer no legal consequences.',
    options: [
      'Evidence matches the entry without an exclusion',
      'Plausible fit with material ambiguity',
      'Shared vocabulary but a different principal activity',
      'Insufficient evidence to classify',
    ],
    evidence: 'Score concrete activity evidence, not confidence in the company.',
    levels: [
      '0 — no usable evidence',
      '1 — generic description',
      '2 — concrete products or services',
      '3 — principal activity and exclusions addressed',
    ],
  },
  es: {
    invalid: 'Datos, opciones o fechas del portafolio inválidos.',
    failed:
      'Comando fallido: compruebe entradas, presupuesto, accesos y destino. Sin rectificación automática.',
    questions: [
      '¿Qué futuro código APE figura en la fuente Sirene fechada?',
      '¿Qué rúbrica oficial y versión de las notas corresponden al código propuesto?',
      '¿Qué productos o servicios establecen concretamente la actividad principal?',
      '¿El responsable ha comprobado inclusiones y exclusiones de la rúbrica?',
      '¿Debe revisarse manualmente el expediente o autorizar otra evaluación limitada?',
    ],
    fit: 'Evalúe si la actividad productiva principal documentada corresponde a esta rúbrica NAF 2025. Use insufficient_evidence si las pruebas no establecen la actividad principal. No deduzca consecuencias jurídicas.',
    options: [
      'Las pruebas coinciden con la rúbrica sin exclusión',
      'Coincidencia plausible con ambigüedad importante',
      'Vocabulario común pero actividad principal distinta',
      'Pruebas insuficientes para clasificar',
    ],
    evidence: 'Evalúe pruebas concretas de actividad, no confianza en la empresa.',
    levels: [
      '0 — ninguna prueba utilizable',
      '1 — descripción genérica',
      '2 — productos o servicios concretos',
      '3 — actividad principal y exclusiones examinadas',
    ],
  },
};
export const portfolioError = () =>
  new TypeError(['fr', 'en', 'es'].map((lang) => PORTFOLIO_TEXT[lang].invalid).join(' / '));
export function nafQuestions(lang = 'en') {
  if (!Object.hasOwn(PORTFOLIO_TEXT, lang)) throw portfolioError();
  const t = PORTFOLIO_TEXT[lang];
  return {
    fit: {
      type: 'choice',
      instructions: t.fit,
      criteria: Object.fromEntries(
        ['strong_fit', 'possible_fit', 'weak_fit', 'insufficient_evidence'].map((key, index) => [
          key,
          t.options[index],
        ]),
      ),
    },
    evidence: { type: 'score', instructions: t.evidence, criteria: t.levels },
  };
}
