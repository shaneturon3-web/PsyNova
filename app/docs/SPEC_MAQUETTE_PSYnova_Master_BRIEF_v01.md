# PsyNova — Brief maître maquette / Master mockup brief (v01)

**Tag:** `[MAQUETTE — données fictives]` · cohérent avec le dépôt `virtual-psychology-clinic/` (Vite + NestJS + PostgreSQL).

Ce document condense le prompt optimisé pour équipe dev ou IA génératrice : structure, contenu, conformité, actifs et limites légales, sans ambiguïté.

---

## 0. Avis canonique (obligatoire, toutes surfaces)

**Texte exact à afficher de façon visible et persistante (frontend) :**

> **Ceci est une maquette · This is a mockup · Esto es un prototipo** — *aucune donnée réelle · no real data · sin datos reales*

Variantes acceptables : même ordre des trois langues ; le bloc « aucune donnée… » peut être sur une deuxième ligne. **Ne pas** impliquer un service clinique réel.

**Backend (visibilité machine) :** en-tête HTTP `X-PsyNova-Maquette` sur toutes les réponses API (voir implémentation). Les payloads JSON peuvent inclure `tag` ou `disclaimer` là où le modèle existe déjà.

---

## 1. Rôles simulés (équipe « créative »)

| Rôle | Responsabilité dans le brief |
| --- | --- |
| UX/UI | Navigation, responsive, WCAG 2.1 AA visé, états vides/erreur/chargement |
| Full-stack | Alignement schéma DB ↔ API ↔ UI ; seeds fictifs |
| Conformité QC | Loi 25, principes OPQ, orientation sans remplacer avis juridique |
| Rédaction clinique | Formulations non stigmatisantes ; pas de promesse de guérison |
| Direction visuelle | Illustrations *cartoon* professionnelles décrites (pas de photos réelles) |

**Avertissement :** ce brief n’est **pas** un avis juridique. Révision par juriste et par l’Ordre pour tout usage public réel.

---

## 2. Personnages et données fictifs

- **Noms** : style « cartoon » cohérent (ex. *Dr. Luna Brightmind*, *Alex Cloudwalker*) — **aucune** homonymie recherchée avec des personnes réelles.
- **Patients / dossiers** : identifiants et notes **générés** ; pas de données cliniques réelles.
- **Images** : décrire en texte pour génération ultérieure : style *soft pastel*, *semi-flat*, expressions **respectueuses**, récupération / progrès ; éviter stéréotypes et caricature offensive.

---

## 3. Langues et adaptation culturelle

| Priorité | Langue |
| --- | --- |
| 1 | Français (Québec) |
| 2 | Anglais |
| 3 | Espagnol (interface + contenus pédagogiques, comme déjà prévu au niveau produit) |

**Implémentation :** clés i18n par chaîne ; dates/heures locale Montréal ; pas d’affirmation de siège social réel sans validation.

---

## 4. Carte du site et modules (cible)

| Zone | Contenu |
| --- | --- |
| Accueil | Proposition de valeur éthique, liens services, CTA maquette |
| À propos | Mission fictive, valeurs, OPQ mention informative |
| Services | Liste alignée sur catégories DRAFT + textes pédagogiques |
| Équipe | Fiches personnages + descriptions d’illustrations |
| Réservations | Wizard existant (étendre consentements si requis) |
| Blog | Articles santé mentale contextualisés Montréal / QC (fictifs) |
| Contact | Formulaire sans envoi réel ou endpoint mock |
| Espace patient | Auth démo, liste de rendez-vous (données fictives) |
| Admin (optionnel) | Dashboard simulé, logs anonymisés |

**État actuel du dépôt :** partie « app authentifiée » et booking **partiellement** implémentée ; blog, admin complet, messagerie, EHR détaillé **non câblés** — voir § 12.

---

## 5. Conformité et éthique (cadre)

- **Loi 25** (Québec) : transparence, consentement, droits, conservation — textes *placeholder* marqués draft jusqu’à validation juridique.
- **OPQ** : ton professionnel ; pas de garantie de résultat ; limites de la télépsychologie ; orientation aux urgences (911 / lignes locales).
- **Code des professions (principes)** : compétence, intégrité — reflété dans les disclaimers générés.

**Disclaimers à prévoir (liste de contenu) :** consentement éclairé (version information), confidentialité, utilisation du site, télépsychologie, urgences et crises, absence de garantie de résultat, propriété intellectuelle, révision des politiques, contact DPO fictif en maquette.

---

## 6. Backend « réaliste mais simulé »

- Auth JWT (déjà en place) avec rôles `patient` | `clinician` | `admin`.
- CRUD partiel : citas (`appointments`) + `service_category` (DRAFT).
- Extensions possibles (phases) : `clinical_notes` fictives, `messages` mock, `audit_log` anonymisé, `consent_records` booléens + version de politique.

---

## 7. Schéma de données (ébauche)

Tables existantes : `users`, `appointments`, `clinics`.

Extensions suggérées (migration future) : `blog_posts`, `staff_profiles`, `consent_acceptances`, `message_threads` / `messages`, `clinical_note_templates`.

---

## 8. API (REST)

Préfixe `/api` — patterns Nest existants. Nouvelles routes possibles : `GET /content/services`, `GET /blog`, `POST /contact` (no-op ou file log), `GET /staff`.

---

## 9. Stack alignée sur le dépôt

| Couche | Choix actuel |
| --- | --- |
| Frontend | Vite, vanilla ES modules (évoluable vers composants) |
| Backend | NestJS |
| DB | PostgreSQL (Docker) |
| Docs API | Swagger `/api/docs` |

*(Le prompt mentionne Next.js comme option ; le produit reste sur Vite sauf décision `[DECISION]`.)*

---

## 10. Structure de dossiers (cible)

```
virtual-psychology-clinic/
  docs/                    ← ce brief
  frontend/src/            ← UI, i18n futur, service-categories.js
  backend/src/             ← modules Nest
  database/                ← schema + migrations SQL
  ops/                     ← scripts, politiques port
```

---

## 11. Développement et déploiement

- Setup : `README.md` à la racine `virtual-psychology-clinic/`.
- Variables : `backend/.env.example`, `frontend/.env.example`.
- **Production :** l’avis maquette doit rester visible ; pas de désactivation silencieuse.

---

## 12. Phases d’implémentation suggérées

1. **Fait / partiel :** avis global + en-tête API ; booking + catégories DRAFT ; auth ; appointments.
2. **Court terme :** pages publiques statiques (À propos, Services) + i18n trois langues pour chaînes clés.
3. **Moyen terme :** blog mock + fiches équipe + descriptions d’illustrations.
4. **Long terme :** messagerie simulée, notes cliniques fictives, admin, CI/CD.

---

## 13. Traçabilité

- **Référence prompt source :** demande utilisateur « prompt optimisé en un seul bloc » (session courante).
- **Révision :** incrémenter `v02` si le périmètre légal ou OPQ change.
