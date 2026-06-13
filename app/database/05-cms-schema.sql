-- [MOCKUP PURPOSE ONLY - NOT REAL DATA]
-- Headless CMS tables: multilingual fields, media, draft/publish.

CREATE TABLE IF NOT EXISTS cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT,
  public_url TEXT,
  mime_type TEXT NOT NULL DEFAULT 'image/svg+xml',
  alt_fr TEXT,
  alt_en TEXT,
  alt_es TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cms_media_path_or_url CHECK (storage_path IS NOT NULL OR public_url IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS cms_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  avatar_media_id UUID REFERENCES cms_media (id) ON DELETE SET NULL,
  name_fr TEXT,
  name_en TEXT,
  name_es TEXT,
  role_fr TEXT,
  role_en TEXT,
  role_es TEXT,
  bio_fr TEXT,
  bio_en TEXT,
  bio_es TEXT,
  illustration_note TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  title_fr TEXT,
  title_en TEXT,
  title_es TEXT,
  body_fr TEXT,
  body_en TEXT,
  body_es TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order INT NOT NULL DEFAULT 0,
  avatar_media_id UUID REFERENCES cms_media (id) ON DELETE SET NULL,
  author_fr TEXT,
  author_en TEXT,
  author_es TEXT,
  quote_fr TEXT,
  quote_en TEXT,
  quote_es TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_home_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order INT NOT NULL DEFAULT 0,
  section_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  date_published DATE,
  title_fr TEXT,
  title_en TEXT,
  title_es TEXT,
  excerpt_fr TEXT,
  excerpt_en TEXT,
  excerpt_es TEXT,
  body_fr TEXT,
  body_en TEXT,
  body_es TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_doctors_sort ON cms_doctors (sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_services_sort ON cms_services (sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_testimonials_sort ON cms_testimonials (sort_order);
CREATE INDEX IF NOT EXISTS idx_cms_home_sections_sort ON cms_home_sections (sort_order);
