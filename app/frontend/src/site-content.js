/**
 * Contenu fictif — noms cartoon, aucune personne réelle.
 * Descriptions d’illustration pour génération d’assets ultérieure.
 */

export const TEAM = [
  {
    id: 'luna',
    name: 'Dr. Luna Brightmind',
    role: { fr: 'Psychologue', en: 'Psychologist', es: 'Psicóloga' },
    bio: {
      fr: 'Approche intégrative TCC et pleine conscience. Focus sur l’anxiété et les transitions de vie.',
      en: 'Integrative CBT and mindfulness. Focus on anxiety and life transitions.',
      es: 'TCC integrativa y mindfulness. Ansiedad y transiciones vitales.',
    },
    illustration:
      'Semi-flat portrait, soft teal and cream palette, warm smile, open posture, notebook motif in background — calm professionalism.',
  },
  {
    id: 'milo',
    name: 'Milo Dreamleaf',
    role: { fr: 'Travailleur social clinique', en: 'Clinical social worker', es: 'Trabajador social clínico' },
    bio: {
      fr: 'Soutien aux familles et aux jeunes; perspective systémique.',
      en: 'Supports families and youth; systemic lens.',
      es: 'Apoyo a familias y jóvenes; enfoque sistémico.',
    },
    illustration:
      'Pastel greens, seated figure with plant motif symbolizing growth, gentle eye contact, inclusive silhouette.',
  },
  {
    id: 'alex',
    name: 'Alex Cloudwalker',
    role: { fr: 'Psychothérapeute', en: 'Psychotherapist', es: 'Psicoterapeuta' },
    bio: {
      fr: 'Affirmatif 2SLGBTQ+; thérapie axée sur les forces et la résilience.',
      en: '2SLGBTQ+-affirming; strengths-based, resilience-focused care.',
      es: 'Afirmativo 2SLGBTQ+; enfoque en fortalezas y resiliencia.',
    },
    illustration:
      'Soft lavender and sky blue, abstract path/walkway motif, hopeful expression, recovery-oriented composition.',
  },
];

export const BLOG_POSTS = [
  {
    slug: 'hiver-montréal',
    title: {
      fr: 'L’hiver à Montréal et l’humeur : pistes d’auto-soins',
      en: 'Montreal winters and mood: gentle self-care ideas',
      es: 'Invierno en Montreal y el ánimo: ideas de autocuidado',
    },
    date: '2026-01-15',
    excerpt: {
      fr: 'Lumière, mouvement et lien social : rappels non médicalisés pour une maquette pédagogique.',
      en: 'Light, movement, connection — educational mockup, not medical advice.',
      es: 'Luz, movimiento y vínculos — contenido educativo de maqueta.',
    },
    body: {
      fr: `<p>Ceci est un <strong>article fictif</strong>. En pratique, un professionnel peut recommander luminothérapie validée, activité physique adaptée et suivis personnalisés.</p><p>Aucune donnée réelle ; viser une revue clinique avant publication.</p>`,
      en: `<p>This is a <strong>fictional article</strong>. In real care, clinicians may suggest evidence-based light therapy, tailored exercise, and follow-up.</p><p>No real data; clinical review required before live use.</p>`,
      es: `<p>Artículo <strong>ficticio</strong>. En la práctica clínica real se personalizan intervenciones con evidencia.</p>`,
    },
  },
  {
    slug: 'telepsychologie-quebec',
    title: {
      fr: 'Télépsychologie au Québec : attentes réalistes',
      en: 'Telepsychology in Quebec: realistic expectations',
      es: 'Telepsicología en Quebec: expectativas realistas',
    },
    date: '2026-02-01',
    excerpt: {
      fr: 'Confidentialité, consentement et limites technologiques — rappel pour la maquette.',
      en: 'Privacy, consent, tech limits — mockup reminder.',
      es: 'Privacidad, consentimiento y límites técnicos.',
    },
    body: {
      fr: `<p>La télépsychologie peut améliorer l’accès ; elle ne convient pas à toutes les situations. L’urgence vitale reste hors plateforme.</p>`,
      en: `<p>Telepsychology can improve access; it is not for every situation. Life-threatening emergencies belong off-platform.</p>`,
      es: `<p>Mejora el acceso pero no sustituye la emergencia presencial cuando hace falta.</p>`,
    },
  },
];

export function teamRole(member, lang) {
  return member.role[lang] || member.role.en;
}

export function teamBio(member, lang) {
  return member.bio[lang] || member.bio.en;
}

export function blogField(post, field, lang) {
  const v = post[field];
  if (!v) return '';
  return typeof v === 'string' ? v : v[lang] || v.en;
}
