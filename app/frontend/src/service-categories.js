/**
 * DRAFT — Catálogo de motifs de consultation / fil d’intake.
 * Source unique pour l’UI booking; l’API persiste le slug choisi (service_category).
 * Réviser les libellés avec l’équipe clinique avant production.
 */
export const DRAFT_SERVICE_CATEGORIES = [
  {
    id: 'individual',
    labelFr: 'Thérapie individuelle',
    labelEn: 'Individual therapy',
    blurbFr: 'Suivi psychologique individuel (adultes).',
    blurbEn: 'One-to-one psychological care (adults).',
  },
  {
    id: 'couples',
    labelFr: 'Couple',
    labelEn: 'Couples',
    blurbFr: 'Soutien relationnel et médiation thérapeutique.',
    blurbEn: 'Relationship support and therapeutic mediation.',
  },
  {
    id: 'family',
    labelFr: 'Famille',
    labelEn: 'Family',
    blurbFr: 'Séances impliquant plusieurs membres de la famille.',
    blurbEn: 'Sessions involving multiple family members.',
  },
  {
    id: 'youth',
    labelFr: 'Jeunesse (12–17)',
    labelEn: 'Youth (12–17)',
    blurbFr: 'Accompagnement adapté aux adolescents.',
    blurbEn: 'Developmentally appropriate adolescent support.',
  },
  {
    id: 'anxiety_mood',
    labelFr: 'Anxiété & humeur',
    labelEn: 'Anxiety & mood',
    blurbFr: 'Symptômes d’anxiété, dépression, stress.',
    blurbEn: 'Anxiety, depression, and stress-related symptoms.',
  },
  {
    id: 'adhd_focus',
    labelFr: 'TDAH / attention',
    labelEn: 'ADHD / attention',
    blurbFr: 'Difficultés d’attention, organisation, exécution.',
    blurbEn: 'Attention, organization, and executive functioning.',
  },
  {
    id: 'trauma',
    labelFr: 'Trauma informé',
    labelEn: 'Trauma-informed',
    blurbFr: 'Approches sensibles aux vécu traumatiques.',
    blurbEn: 'Trauma-sensitive clinical approaches.',
  },
  {
    id: 'assessment',
    labelFr: 'Évaluation',
    labelEn: 'Assessment',
    blurbFr: 'Bilan orienté diagnostic ou orientation de services.',
    blurbEn: 'Diagnostic-oriented or service-planning assessment.',
  },
  {
    id: 'other',
    labelFr: 'Autre',
    labelEn: 'Other',
    blurbFr: 'Précisez dans les notes au clinicien.',
    blurbEn: 'Add details in notes to clinician.',
  },
];

/** @param {string} lang 'fr' | 'en' | 'es' */
export function categoryLabel(cat, lang) {
  if (lang === 'fr') return cat.labelFr;
  if (lang === 'es') return cat.labelEn;
  return cat.labelEn;
}

export function categoryBlurb(cat, lang) {
  if (lang === 'fr') return cat.blurbFr;
  if (lang === 'es') return cat.blurbEn;
  return cat.blurbEn;
}

export function getCategoryById(id) {
  return DRAFT_SERVICE_CATEGORIES.find((c) => c.id === id) || null;
}
