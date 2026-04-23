-- [MOCKUP PURPOSE ONLY - NOT REAL DATA]
-- Cartoon-style avatar URLs (Dicebear SVG) — replaceable via CMS media upload.

INSERT INTO cms_media (id, public_url, mime_type, alt_en, alt_fr, alt_es)
VALUES
  ('a0000001-0000-4000-8000-000000000001', 'https://api.dicebear.com/7.x/micah/svg?seed=DrLunaBrightmind&backgroundColor=b6e3f4', 'image/svg+xml', 'Cartoon avatar — Dr. Luna Brightmind', 'Avatar cartoon — Dr. Luna Brightmind', 'Avatar cartoon — Dra. Luna Brightmind'),
  ('a0000001-0000-4000-8000-000000000002', 'https://api.dicebear.com/7.x/micah/svg?seed=MiloDreamleaf&backgroundColor=d1f4e0', 'image/svg+xml', 'Cartoon avatar — Milo Dreamleaf', 'Avatar cartoon — Milo Dreamleaf', 'Avatar cartoon — Milo Dreamleaf'),
  ('a0000001-0000-4000-8000-000000000003', 'https://api.dicebear.com/7.x/micah/svg?seed=AlexCloudwalker&backgroundColor=e8d5f2', 'image/svg+xml', 'Cartoon avatar — Alex Cloudwalker', 'Avatar cartoon — Alex Cloudwalker', 'Avatar cartoon — Alex Cloudwalker'),
  ('a0000001-0000-4000-8000-000000000004', 'https://api.dicebear.com/7.x/micah/svg?seed=PatientAvery&backgroundColor=fff4e6', 'image/svg+xml', 'Cartoon avatar — patient testimonial', 'Avatar cartoon — témoignage', 'Avatar cartoon — testimonio'),
  ('a0000001-0000-4000-8000-000000000005', 'https://api.dicebear.com/7.x/micah/svg?seed=PatientJordan&backgroundColor=f0f4ff', 'image/svg+xml', 'Cartoon avatar — patient testimonial', 'Avatar cartoon — témoignage', 'Avatar cartoon — testimonio'),
  ('a0000001-0000-4000-8000-000000000006', 'https://api.dicebear.com/7.x/micah/svg?seed=PatientSam&backgroundColor=fce4ec', 'image/svg+xml', 'Cartoon avatar — patient testimonial', 'Avatar cartoon — témoignage', 'Avatar cartoon — testimonio')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cms_doctors (id, slug, sort_order, avatar_media_id, name_fr, name_en, name_es, role_fr, role_en, role_es, bio_fr, bio_en, bio_es, illustration_note, published)
VALUES
  (
    'd0000001-0000-4000-8000-000000000001',
    'luna',
    0,
    'a0000001-0000-4000-8000-000000000001',
    'Dr. Luna Brightmind',
    'Dr. Luna Brightmind',
    'Dra. Luna Brightmind',
    'Psychologue',
    'Psychologist',
    'Psicóloga',
    '<p>Approche intégrative TCC et pleine conscience. Focus sur l’anxiété et les transitions de vie.</p>',
    '<p>Integrative CBT and mindfulness. Focus on anxiety and life transitions.</p>',
    '<p>TCC integrativa y mindfulness. Ansiedad y transiciones vitales.</p>',
    'Semi-flat portrait, soft teal and cream palette, warm smile — calm professionalism.',
    true
  ),
  (
    'd0000001-0000-4000-8000-000000000002',
    'milo',
    1,
    'a0000001-0000-4000-8000-000000000002',
    'Milo Dreamleaf',
    'Milo Dreamleaf',
    'Milo Dreamleaf',
    'Travailleur social clinique',
    'Clinical social worker',
    'Trabajador social clínico',
    '<p>Soutien aux familles et aux jeunes; perspective systémique.</p>',
    '<p>Supports families and youth; systemic lens.</p>',
    '<p>Apoyo a familias y jóvenes; enfoque sistémico.</p>',
    'Pastel greens, seated figure with plant motif — inclusive silhouette.',
    true
  ),
  (
    'd0000001-0000-4000-8000-000000000003',
    'alex',
    2,
    'a0000001-0000-4000-8000-000000000003',
    'Alex Cloudwalker',
    'Alex Cloudwalker',
    'Alex Cloudwalker',
    'Psychothérapeute',
    'Psychotherapist',
    'Psicoterapeuta',
    '<p>Affirmatif 2SLGBTQ+; thérapie axée sur les forces et la résilience.</p>',
    '<p>2SLGBTQ+-affirming; strengths-based, resilience-focused care.</p>',
    '<p>Afirmativo 2SLGBTQ+; enfoque en fortalezas y resiliencia.</p>',
    'Soft lavender and sky blue, abstract path motif — recovery-oriented.',
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO cms_services (id, slug, sort_order, title_fr, title_en, title_es, body_fr, body_en, body_es, published)
VALUES
  ('e0000001-0000-4000-8000-000000000001', 'individual', 0, 'Thérapie individuelle', 'Individual therapy', 'Terapia individual', '<p>Suivi psychologique individuel (adultes).</p>', '<p>One-to-one psychological care (adults).</p>', '<p>Atención psicológica individual (adultos).</p>', true),
  ('e0000001-0000-4000-8000-000000000002', 'couples', 1, 'Couple', 'Couples', 'Pareja', '<p>Soutien relationnel et médiation thérapeutique.</p>', '<p>Relationship support and therapeutic mediation.</p>', '<p>Apoyo relacional y mediación terapéutica.</p>', true),
  ('e0000001-0000-4000-8000-000000000003', 'family', 2, 'Famille', 'Family', 'Familia', '<p>Séances impliquant plusieurs membres de la famille.</p>', '<p>Sessions involving multiple family members.</p>', '<p>Sesiones con varios miembros de la familia.</p>', true),
  ('e0000001-0000-4000-8000-000000000004', 'youth', 3, 'Jeunesse (12–17)', 'Youth (12–17)', 'Juventud (12–17)', '<p>Accompagnement adapté aux adolescents.</p>', '<p>Developmentally appropriate adolescent support.</p>', '<p>Acompañamiento adaptado a adolescentes.</p>', true),
  ('e0000001-0000-4000-8000-000000000005', 'anxiety_mood', 4, 'Anxiété & humeur', 'Anxiety & mood', 'Ansiedad y estado de ánimo', '<p>Symptômes d’anxiété, dépression, stress.</p>', '<p>Anxiety, depression, and stress-related symptoms.</p>', '<p>Ansiedad, depresión y estrés.</p>', true),
  ('e0000001-0000-4000-8000-000000000006', 'adhd_focus', 5, 'TDAH / attention', 'ADHD / attention', 'TDAH / atención', '<p>Difficultés d’attention, organisation, exécution.</p>', '<p>Attention, organization, and executive functioning.</p>', '<p>Atención, organización y funciones ejecutivas.</p>', true),
  ('e0000001-0000-4000-8000-000000000007', 'trauma', 6, 'Trauma informé', 'Trauma-informed', 'Informado en trauma', '<p>Approches sensibles aux vécu traumatiques.</p>', '<p>Trauma-sensitive clinical approaches.</p>', '<p>Enfoques sensibles al trauma.</p>', true),
  ('e0000001-0000-4000-8000-000000000008', 'assessment', 7, 'Évaluation', 'Assessment', 'Evaluación', '<p>Bilan orienté diagnostic ou orientation de services.</p>', '<p>Diagnostic-oriented or service-planning assessment.</p>', '<p>Evaluación orientada al diagnóstico o planificación.</p>', true),
  ('e0000001-0000-4000-8000-000000000009', 'other', 8, 'Autre', 'Other', 'Otro', '<p>Précisez dans les notes au clinicien.</p>', '<p>Add details in notes to clinician.</p>', '<p>Detalles en notas al clínico.</p>', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cms_testimonials (id, sort_order, avatar_media_id, author_fr, author_en, author_es, quote_fr, quote_en, quote_es, published)
VALUES
  (
    'f0000001-0000-4000-8000-000000000001',
    0,
    'a0000001-0000-4000-8000-000000000004',
    'Avery L. (fictif)',
    'Avery L. (fictional)',
    'Avery L. (ficticio)',
    '<p>Interface claire pour la démo — aucune donnée réelle, mais le parcours est rassurant.</p>',
    '<p>Clear interface for the demo — no real data, but the flow feels reassuring.</p>',
    '<p>Interfaz clara para la demo — sin datos reales, pero el flujo transmite calma.</p>',
    true
  ),
  (
    'f0000001-0000-4000-8000-000000000002',
    1,
    'a0000001-0000-4000-8000-000000000005',
    'Jordan M. (fictif)',
    'Jordan M. (fictional)',
    'Jordan M. (ficticio)',
    '<p>La prise de rendez-vous guidée est utile pour valider l’ergonomie.</p>',
    '<p>Guided booking helps validate the ergonomics.</p>',
    '<p>La reserva guiada ayuda a validar la ergonomía.</p>',
    true
  ),
  (
    'f0000001-0000-4000-8000-000000000003',
    2,
    'a0000001-0000-4000-8000-000000000006',
    'Sam R. (fictif)',
    'Sam R. (fictional)',
    'Sam R. (ficticio)',
    '<p>Contenu trilingue cohérent pour une maquette pédagogique.</p>',
    '<p>Consistent trilingual content for an educational mockup.</p>',
    '<p>Contenido trilingüe coherente para una maqueta educativa.</p>',
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO cms_home_sections (id, sort_order, section_type, payload, published)
VALUES
  (
    'b0000001-0000-4000-8000-000000000001',
    0,
    'hero',
    '{"title":{"fr":"Clinique virtuelle de psychologie — Montréal","en":"Virtual psychology clinic — Montreal","es":"Clínica virtual de psicología — Montreal"},"lead":{"fr":"Accompagnement psychologique téléphonique et en visioconférence. Maquette à des fins de démonstration — aucun service clinique réel.","en":"Telephone and video support (mockup). Demonstration only — no real clinical service.","es":"Acompañamiento por teléfono y videollamada. Maqueta de demostración — sin servicio clínico real."},"ctaPrimary":{"label":{"fr":"Créer un compte fictif","en":"Create a demo account","es":"Cuenta de demostración"},"href":"#/register"},"ctaSecondary":{"label":{"fr":"Avis légaux","en":"Legal notices","es":"Avisos legales"},"href":"#/legal"},"ctaBook":{"label":{"fr":"Prendre rendez-vous","en":"Book a session","es":"Reservar"},"href":"#/login"}}'::jsonb,
    true
  ),
  (
    'b0000001-0000-4000-8000-000000000002',
    1,
    'feature_grid',
    '{"cards":[{"title":{"fr":"Services","en":"Services","es":"Servicios"},"blurb":{"fr":"Les catégories relient le formulaire de réservation une fois connecté.","en":"Categories connect to booking after sign-in.","es":"Las categorías enlazan con la reserva tras iniciar sesión."},"href":"#/services"},{"title":{"fr":"Équipe","en":"Team","es":"Equipo"},"blurb":{"fr":"Personnages fictifs et avatars cartoon.","en":"Fictional characters and cartoon avatars.","es":"Personajes ficticios y avatares cartoon."},"href":"#/team"},{"title":{"fr":"Blogue","en":"Blog","es":"Blog"},"blurb":{"fr":"Articles pédagogiques d’exemple.","en":"Educational sample posts.","es":"Artículos educativos de ejemplo."},"href":"#/blog"}]}'::jsonb,
    true
  ),
  (
    'b0000001-0000-4000-8000-000000000003',
    2,
    'testimonial_strip',
    '{"heading":{"fr":"Témoignages (fictifs)","en":"Testimonials (fictional)","es":"Testimonios (ficticios)"}}'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO cms_blog_posts (id, slug, date_published, title_fr, title_en, title_es, excerpt_fr, excerpt_en, excerpt_es, body_fr, body_en, body_es, published)
VALUES
  (
    'c0000001-0000-4000-8000-000000000001',
    'hiver-montréal',
    '2026-01-15',
    'L’hiver à Montréal et l’humeur : pistes d’auto-soins',
    'Montreal winters and mood: gentle self-care ideas',
    'Invierno en Montreal y el ánimo: ideas de autocuidado',
    'Lumière, mouvement et lien social : rappels non médicalisés pour une maquette pédagogique.',
    'Light, movement, connection — educational mockup, not medical advice.',
    'Luz, movimiento y vínculos — contenido educativo de maqueta.',
    '<p>Ceci est un <strong>article fictif</strong>. En pratique, un professionnel peut recommander luminothérapie validée, activité physique adaptée et suivis personnalisés.</p><p>Aucune donnée réelle ; viser une revue clinique avant publication.</p>',
    '<p>This is a <strong>fictional article</strong>. In real care, clinicians may suggest evidence-based light therapy, tailored exercise, and follow-up.</p><p>No real data; clinical review required before live use.</p>',
    '<p>Artículo <strong>ficticio</strong>. En la práctica clínica real se personalizan intervenciones con evidencia.</p>',
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000002',
    'telepsychologie-quebec',
    '2026-02-01',
    'Télépsychologie au Québec : attentes réalistes',
    'Telepsychology in Quebec: realistic expectations',
    'Telepsicología en Quebec: expectativas realistas',
    'Confidentialité, consentement et limites technologiques — rappel pour la maquette.',
    'Privacy, consent, tech limits — mockup reminder.',
    'Privacidad, consentimiento y límites técnicos.',
    '<p>La télépsychologie peut améliorer l’accès ; elle ne convient pas à toutes les situations. L’urgence vitale reste hors plateforme.</p>',
    '<p>Telepsychology can improve access; it is not for every situation. Life-threatening emergencies belong off-platform.</p>',
    '<p>Mejora el acceso pero no sustituye la emergencia presencial cuando hace falta.</p>',
    true
  )
ON CONFLICT (id) DO NOTHING;
