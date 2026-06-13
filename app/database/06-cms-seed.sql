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
    '{"cards":[{"title":{"fr":"Services","en":"Services","es":"Servicios"},"blurb":{"fr":"Les catégories relient le formulaire de réservation une fois connecté.","en":"Categories connect to booking after sign-in.","es":"Las categorías enlazan con la reserva tras iniciar sesión."},"href":"#/services"},{"title":{"fr":"Équipe","en":"Team","es":"Equipo"},"blurb":{"fr":"Personnages fictifs et avatars cartoon.","en":"Fictional characters and cartoon avatars.","es":"Personajes ficticios y avatares cartoon."},"href":"#/team"},{"title":{"fr":"Blogue","en":"Blog","es":"Blog"},"blurb":{"fr":"Articles courts citant OMS, NIH/NIMH, CDC, NHLBI, etc.","en":"Short posts citing WHO, NIH/NIMH, CDC, NHLBI, and related agencies.","es":"Textos breves con citas a OMS, NIH/NIMH, CDC, NHLBI, etc."},"href":"#/blog"}]}'::jsonb,
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
    'nimh-seasonal-affective-disorder',
    '2026-01-10',
    $cms0_tf$Trouble affectif saisonnier — rappels du NIMH$cms0_tf$,
    $cms0_te$Seasonal affective disorder: NIMH overview$cms0_te$,
    $cms0_tsx$Trastorno afectivo estacional — resumen NIMH$cms0_tsx$,
    $cms0_ef$Résumé pédagogique à partir du National Institute of Mental Health (USA). Sans avis médical.$cms0_ef$,
    $cms0_ee$Lay summary sourced from NIH/NIMH (U.S.). Not medical advice.$cms0_ee$,
    $cms0_esx$Resumen educativo basado en NIMH (EE. UU.). No es consejo médico.$cms0_esx$,
    $cms0_bf$<p>Résumé éducatif pour la démo PsyNova. La citation ci-dessous provient des contenus pour le grand public du NIMH.</p><blockquote cite="https://www.nimh.nih.gov/health/publications/seasonal-affective-disorder"><p>SAD is a type of depression characterized by a recurrent seasonal pattern, with symptoms lasting about 4–5 months out of the year.</p></blockquote><p><strong>Source&nbsp;:</strong> <a href="https://www.nimh.nih.gov/health/publications/seasonal-affective-disorder" rel="noopener noreferrer">National Institute of Mental Health (NIH)</a> — Consulté mai&nbsp;2026. Œuvres du gouvernement fédéral des États-Unis.</p>$cms0_bf$,
    $cms0_be$<p>Educational summary for PsyNova’s public blog. Below, a verbatim excerpt drawn from NIH/NIMH consumer information (U.S. government work).</p><blockquote cite="https://www.nimh.nih.gov/health/publications/seasonal-affective-disorder"><p>SAD is a type of depression characterized by a recurrent seasonal pattern, with symptoms lasting about 4–5 months out of the year.</p></blockquote><p><strong>Source:</strong> <a href="https://www.nimh.nih.gov/health/publications/seasonal-affective-disorder" rel="noopener noreferrer">National Institute of Mental Health (NIH)</a>. Accessed May&nbsp;2026. U.S. government work.</p><p>This page is informational only and does not replace care from a qualified clinician.</p>$cms0_be$,
    $cms0_bs$<p>Resumen educativo. La cita siguiente proviene del material para el público del NIMH (inglés original).</p><blockquote cite="https://www.nimh.nih.gov/health/publications/seasonal-affective-disorder"><p>SAD is a type of depression characterized by a recurrent seasonal pattern, with symptoms lasting about 4–5 months out of the year.</p></blockquote><p><strong>Fuente:</strong> <a href="https://www.nimh.nih.gov/health/publications/seasonal-affective-disorder" rel="noopener noreferrer">NIMH (NIH)</a>, consultado en mayo de 2026.</p>$cms0_bs$,
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000002',
    'cdc-mental-health-overview',
    '2026-01-12',
    $cms1_tf$Qu’est-ce que la santé mentale&nbsp;? (CDC)$cms1_tf$,
    $cms1_te$What counts as mental health — CDC overview$cms1_te$,
    $cms1_tsx$¿Qué es la salud mental? — CDC$cms1_tsx$,
    $cms1_ef$Définition grand public du Centers for Disease Control and Prevention (É.-U.).$cms1_ef$,
    $cms1_ee$Plain-language definition from CDC mental-health landing pages.$cms1_ee$,
    $cms1_esx$Defensa del bienestar mental según los CDC.$cms1_esx$,
    $cms1_bf$<p>Résumé pour lecteurs nord-américains&nbsp;: les CDC précisent ce que recouvre la santé mentale avant d’aborder les filières de soins.</p><blockquote cite="https://www.cdc.gov/mental-health/index.html"><p>Mental health includes a person’s emotional, psychological, and social well-being.</p></blockquote><p><strong>Source&nbsp;:</strong> Centers for Disease Control and Prevention, <em>Mental Health</em>, <a href="https://www.cdc.gov/mental-health/index.html" rel="noopener noreferrer">cdc.gov/mental-health</a>, consulté mai&nbsp;2026.</p>$cms1_bf$,
    $cms1_be$<p>Federal public-health agencies routinely publish broad definitions before linking to crisis resources and data programs.</p><blockquote cite="https://www.cdc.gov/mental-health/index.html"><p>Mental health includes a person’s emotional, psychological, and social well-being.</p></blockquote><p><strong>Source:</strong> Centers for Disease Control and Prevention (<a href="https://www.cdc.gov/mental-health/index.html" rel="noopener noreferrer">cdc.gov/mental-health</a>). Accessed May&nbsp;2026.</p>$cms1_be$,
    $cms1_bs$<blockquote cite="https://www.cdc.gov/mental-health/index.html"><p>Mental health includes a person’s emotional, psychological, and social well-being.</p></blockquote><p><strong>Fuente:</strong> CDC (<a href="https://www.cdc.gov/mental-health/index.html" rel="noopener noreferrer">cdc.gov</a>), mayo 2026.</p>$cms1_bs$,
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000003',
    'nimh-depression-basics',
    '2026-01-18',
    $cms2_tf$La dépression (trouble dépressif majeur), selon le NIMH$cms2_tf$,
    $cms2_te$Depression basics from NIMH$cms2_te$,
    $cms2_tsx$Depresión: conceptos según el NIMH$cms2_tsx$,
    $cms2_ef$Définition grand public tirée du National Institute of Mental Health.$cms2_ef$,
    $cms2_ee$Consumer-definition excerpt from NIH/NIMH.$cms2_ee$,
    $cms2_esx$Extracto definitorio del NIMH (NIH).$cms2_esx$,
    $cms2_bf$<p>Rappel&nbsp;: texte ci-dessous en anglais tel que publié par le NIH.</p><blockquote cite="https://www.nimh.nih.gov/health/topics/depression"><p>Everyone feels sad or low sometimes, but these feelings usually pass with time.</p></blockquote><p><strong>Source&nbsp;:</strong> <a href="https://www.nimh.nih.gov/health/topics/depression" rel="noopener noreferrer">NIH/NIMH — Depression</a>, mai&nbsp;2026.</p>$cms2_bf$,
    $cms2_be$<p>Depressive disorders are clinically serious; public-health agencies distinguish passing low mood from illnesses that need treatment.</p><blockquote cite="https://www.nimh.nih.gov/health/topics/depression"><p>Everyone feels sad or low sometimes, but these feelings usually pass with time.</p></blockquote><p><strong>Source:</strong> <a href="https://www.nimh.nih.gov/health/topics/depression" rel="noopener noreferrer">National Institute of Mental Health</a>. Accessed May&nbsp;2026. U.S. government work—not a substitute for professional assessment.</p>$cms2_be$,
    $cms2_bs$<blockquote cite="https://www.nimh.nih.gov/health/topics/depression"><p>Everyone feels sad or low sometimes, but these feelings usually pass with time.</p></blockquote><p><strong>Fuente:</strong> <a href="https://www.nimh.nih.gov/health/topics/depression" rel="noopener noreferrer">NIMH</a>.</p>$cms2_bs$,
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000004',
    'nimh-anxiety-disorders',
    '2026-01-22',
    $cms3_tf$Troubles anxieux — excerpt NIMH$cms3_tf$,
    $cms3_te$Anxiety disorders: NIH/NIMH primer$cms3_te$,
    $cms3_tsx$Trastornos de ansiedad — NIMH$cms3_tsx$,
    $cms3_ef$Citation courte sur l’anxiété telle que présentée aux patient·e·s par le NIH.$cms3_ef$,
    $cms3_ee$Quoted consumer paragraph on anxiety disorders from NIMH.$cms3_ee$,
    $cms3_esx$Párrafo para el público sobre ansiedad.$cms3_esx$,
    $cms3_bf$<blockquote cite="https://www.nimh.nih.gov/health/topics/anxiety-disorders"><p>Feeling anxious is a normal part of life.</p></blockquote><p><strong>Source&nbsp;:</strong> <a href="https://www.nimh.nih.gov/health/topics/anxiety-disorders" rel="noopener noreferrer">NIH/NIMH — Anxiety Disorders</a>, mai&nbsp;2026.</p>$cms3_bf$,
    $cms3_be$<p>Distinguishing everyday worry from disorders that merit clinical attention is a core psychoeducation topic.</p><blockquote cite="https://www.nimh.nih.gov/health/topics/anxiety-disorders"><p>Feeling anxious is a normal part of life.</p></blockquote><p><strong>Source:</strong> <a href="https://www.nimh.nih.gov/health/topics/anxiety-disorders" rel="noopener noreferrer">NIH/NIMH — Anxiety Disorders</a>. Accessed May&nbsp;2026.</p>$cms3_be$,
    $cms3_bs$<blockquote cite="https://www.nimh.nih.gov/health/topics/anxiety-disorders"><p>Feeling anxious is a normal part of life.</p></blockquote><p><strong>Fuente:</strong> <a href="https://www.nimh.nih.gov/health/topics/anxiety-disorders" rel="noopener noreferrer">NIMH</a>.</p>$cms3_bs$,
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000005',
    'nimh-adhd-overview',
    '2026-02-02',
    $cms4_tf$TDAH chez enfants et ados — NIMH$cms4_tf$,
    $cms4_te$ADHD in children and teens — NIMH facts$cms4_te$,
    $cms4_tsx$TDAH en niños y adolescentes — NIMH$cms4_tsx$,
    $cms4_ef$Début de la page grand public NIH sur le TDAH.$cms4_ef$,
    $cms4_ee$Leading sentence from NIH’s ADHD consumer topic page.$cms4_ee$,
    $cms4_esx$Frase inicial de la página del NIMH.$cms4_esx$,
    $cms4_bf$<blockquote cite="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd"><p>ADHD is one of the most common disorders diagnosed in children.</p></blockquote><p><strong>Source&nbsp;:</strong> <a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" rel="noopener noreferrer">NIH/NIMH — ADHD</a>, mai&nbsp;2026.</p>$cms4_bf$,
    $cms4_be$<p>Federal descriptions highlight that ADHD begins in childhood yet often persists, which shapes treatment planning across the lifespan.</p><blockquote cite="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd"><p>ADHD is one of the most common disorders diagnosed in children.</p></blockquote><p><strong>Source:</strong> <a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" rel="noopener noreferrer">NIH/NIMH — ADHD</a>. Accessed May&nbsp;2026.</p>$cms4_be$,
    $cms4_bs$<blockquote cite="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd"><p>ADHD is one of the most common disorders diagnosed in children.</p></blockquote><p><strong>Fuente:</strong> <a href="https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd" rel="noopener noreferrer">NIMH</a>.</p>$cms4_bs$,
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000006',
    'nimh-ptsd-basics',
    '2026-02-08',
    $cms5_tf$État de stress post-traumatique — NIMH$cms5_tf$,
    $cms5_te$Post-traumatic stress disorder — NIMH$cms5_te$,
    $cms5_tsx$Trastorno de estrés postraumático — NIMH$cms5_tsx$,
    $cms5_ef$Définition clinique vulgarisée par le NIH.$cms5_ef$,
    $cms5_ee$Quoted plain-language PTSD definition.$cms5_ee$,
    $cms5_esx$Definición para el público.$cms5_esx$,
    $cms5_bf$<blockquote cite="https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd"><p>People may be diagnosed with post-traumatic stress disorder (PTSD) if their symptoms last for an extended period after a traumatic event and begin to interfere with aspects of daily life, such as relationships or work.</p></blockquote><p><strong>Source&nbsp;:</strong> <a href="https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd" rel="noopener noreferrer">NIH/NIMH — PTSD</a>, mai&nbsp;2026.</p>$cms5_bf$,
    $cms5_be$<p>PTSD criteria emphasize functional impairment long after the traumatic cue; early psychoeducation can normalize help-seeking.</p><blockquote cite="https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd"><p>People may be diagnosed with post-traumatic stress disorder (PTSD) if their symptoms last for an extended period after a traumatic event and begin to interfere with aspects of daily life, such as relationships or work.</p></blockquote><p><strong>Source:</strong> <a href="https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd" rel="noopener noreferrer">NIH/NIMH — PTSD</a>. Accessed May&nbsp;2026.</p>$cms5_be$,
    $cms5_bs$<blockquote cite="https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd"><p>People may be diagnosed with post-traumatic stress disorder (PTSD) if their symptoms last for an extended period after a traumatic event and begin to interfere with aspects of daily life, such as relationships or work.</p></blockquote><p><strong>Fuente:</strong> <a href="https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd" rel="noopener noreferrer">NIMH</a>.</p>$cms5_bs$,
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000007',
    'nhlbi-why-sleep-matters',
    '2026-02-14',
    $cms6_tf$Pourquoi le sommeil compte pour la santé (NIH/NHLBI)$cms6_tf$,
    $cms6_te$Why sleep health matters — NHLBI (NIH)$cms6_te$,
    $cms6_tsx$Por qué importa dormir bien — NHLBI$cms6_tsx$,
    $cms6_ef$Message de prévention cardiorespiratoire sur le sommeil.$cms6_ef$,
    $cms6_ee$Quoted prevention messaging from NIH’s National Heart, Lung, and Blood Institute.$cms6_ee$,
    $cms6_esx$Mensaje de prevención del NHLBI.$cms6_esx$,
    $cms6_bf$<blockquote cite="https://www.nhlbi.nih.gov/health/sleep/why-sleep-important"><p>Sleep plays a vital role in good health and well-being throughout your life.</p></blockquote><p><strong>Source&nbsp;:</strong> <a href="https://www.nhlbi.nih.gov/health/sleep/why-sleep-important" rel="noopener noreferrer">National Heart, Lung, and Blood Institute (NIH)</a>, mai&nbsp;2026.</p>$cms6_bf$,
    $cms6_be$<p>Sleep interacts with cardiovascular, metabolic, and mental health outcomes; NHLBI summarizes why healthy sleep hygiene matters alongside medical care.</p><blockquote cite="https://www.nhlbi.nih.gov/health/sleep/why-sleep-important"><p>Sleep plays a vital role in good health and well-being throughout your life.</p></blockquote><p><strong>Source:</strong> <a href="https://www.nhlbi.nih.gov/health/sleep/why-sleep-important" rel="noopener noreferrer">NHLBI — Why Is Sleep Important?</a> Accessed May&nbsp;2026.</p>$cms6_be$,
    $cms6_bs$<blockquote cite="https://www.nhlbi.nih.gov/health/sleep/why-sleep-important"><p>Sleep plays a vital role in good health and well-being throughout your life.</p></blockquote><p><strong>Fuente:</strong> <a href="https://www.nhlbi.nih.gov/health/sleep/why-sleep-important" rel="noopener noreferrer">NHLBI (NIH)</a>.</p>$cms6_bs$,
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000008',
    'who-adolescent-mental-health',
    '2026-02-20',
    $cms7_tf$Santé mentale des adolescent·e·s — OMS$cms7_tf$,
    $cms7_te$Adolescent mental health — WHO fact sheet$cms7_te$,
    $cms7_tsx$Salud mental de adolescentes — OMS$cms7_tsx$,
    $cms7_ef$Données mondiales tirées de la fiche OMS.$cms7_ef$,
    $cms7_ee$Global prevalence snippet from WHO’s adolescent mental health factsheet.$cms7_ee$,
    $cms7_esx$Datos globales según la OMS.$cms7_esx$,
    $cms7_bf$<p>L’OMS autorise la reproduction de ses fiches factuelles avec la mention de source indiquée sur le site.</p><blockquote cite="https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health"><p>Globally, one in seven 10-19-year-olds experiences a mental disorder, accounting for 15% of the global burden of disease in this age group.</p></blockquote><p><strong>Source&nbsp;:</strong> World Health Organization, <em>Mental health of adolescents</em> fact sheet, <a href="https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health" rel="noopener noreferrer">who.int</a>, consulté mai&nbsp;2026.</p>$cms7_bf$,
    $cms7_be$<p>WHO highlights the population-level burden of adolescent mental disorders to argue for school- and community-based prevention.</p><blockquote cite="https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health"><p>Globally, one in seven 10-19-year-olds experiences a mental disorder, accounting for 15% of the global burden of disease in this age group.</p></blockquote><p><strong>Source:</strong> World Health Organization, <em>Mental health of adolescents</em> fact sheet (<a href="https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health" rel="noopener noreferrer">who.int</a>). Accessed May&nbsp;2026. Follow WHO credit lines when republishing.</p>$cms7_be$,
    $cms7_bs$<blockquote cite="https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health"><p>Globally, one in seven 10-19-year-olds experiences a mental disorder, accounting for 15% of the global burden of disease in this age group.</p></blockquote><p><strong>Fuente:</strong> OMS, ficha sobre salud mental de los adolescentes (<a href="https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health" rel="noopener noreferrer">who.int</a>).</p>$cms7_bs$,
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000009',
    '988-suicide-and-crisis-lifeline',
    '2026-03-01',
    $cms8_tf$Ligne nationale 988 (États-Unis) pour la détresse$cms8_tf$,
    $cms8_te$988 Suicide & Crisis Lifeline (United States)$cms8_te$,
    $cms8_tsx$Línea 988 de crisis en EE.&nbsp;UU.$cms8_tsx$,
    $cms8_ef$Présentation officielle gratuite disponible jour et nuit.$cms8_ef$,
    $cms8_ee$Quoted description from the federally supported 988lifeline.org site.$cms8_ee$,
    $cms8_esx$Texto oficial del servicio 988.$cms8_esx$,
    $cms8_bf$<blockquote cite="https://988lifeline.org/"><p>Through the 988 Lifeline, you have access to free, quality, one-on-one assistance.</p></blockquote><p><strong>Source&nbsp;:</strong> <a href="https://988lifeline.org/" rel="noopener noreferrer">988 Suicide&nbsp;&amp; Crisis Lifeline</a>. Service américain gratuit 24&nbsp;h/24 — consulté mai&nbsp;2026.</p>$cms8_bf$,
    $cms8_be$<p>Crisis hotlines stabilize immediate risk until local emergency responders or outpatient teams can intervene. The U.S. 988 Lifeline routes texts and calls nationally.</p><blockquote cite="https://988lifeline.org/"><p>Through the 988 Lifeline, you have access to free, quality, one-on-one assistance.</p></blockquote><p><strong>Source:</strong> <a href="https://988lifeline.org/" rel="noopener noreferrer">988 Suicide &amp; Crisis Lifeline</a>. Accessed May&nbsp;2026. Not affiliated with PsyNova; verify instructions on the linked site.</p>$cms8_be$,
    $cms8_bs$<blockquote cite="https://988lifeline.org/"><p>Through the 988 Lifeline, you have access to free, quality, one-on-one assistance.</p></blockquote><p><strong>Fuente:</strong> <a href="https://988lifeline.org/" rel="noopener noreferrer">988 Lifeline</a> (EE. UU.).</p>$cms8_bs$,
    true
  ),
  (
    'c0000001-0000-4000-8000-000000000010',
    'cdc-mental-health-resources-hotlines',
    '2026-03-06',
    $cms9_tf$Ressources de crise américaines (CDC)$cms9_tf$,
    $cms9_te$Crisis-ready mental-health resources — CDC$cms9_te$,
    $cms9_tsx$Recursos y líneas de crisis — CDC$cms9_tsx$,
    $cms9_ef$Points saillants des pages CDC sur l’aide immédiate (anglais original).$cms9_ef$,
    $cms9_ee$Quoted key points covering hotlines from CDC’s Mental Health Resources page.$cms9_ee$,
    $cms9_esx$Extracto de páginas públicas CDC.$cms9_esx$,
    $cms9_bf$<blockquote cite="https://www.cdc.gov/mental-health/caring/index.html"><p>If you need help now, call a crisis hotline to get immediate emergency counseling.</p></blockquote><p><strong>Source&nbsp;:</strong> Centers for Disease Control and Prevention, <em>Mental Health Resources</em>, <a href="https://www.cdc.gov/mental-health/caring/index.html" rel="noopener noreferrer">cdc.gov</a>, consulté mai&nbsp;2026.</p>$cms9_bf$,
    $cms9_be$<p>U.S. federal pages cluster national hotlines alongside tips for locating ongoing care.</p><blockquote cite="https://www.cdc.gov/mental-health/caring/index.html"><p>If you need help now, call a crisis hotline to get immediate emergency counseling.</p></blockquote><p><strong>Source:</strong> Centers for Disease Control and Prevention (<a href="https://www.cdc.gov/mental-health/caring/index.html" rel="noopener noreferrer">Mental Health Resources</a>). Accessed May&nbsp;2026.</p>$cms9_be$,
    $cms9_bs$<blockquote cite="https://www.cdc.gov/mental-health/caring/index.html"><p>If you need help now, call a crisis hotline to get immediate emergency counseling.</p></blockquote><p><strong>Fuente:</strong> CDC (<a href="https://www.cdc.gov/mental-health/caring/index.html" rel="noopener noreferrer">cdc.gov</a>).</p>$cms9_bs$,
    true
  )
ON CONFLICT (id) DO NOTHING;


