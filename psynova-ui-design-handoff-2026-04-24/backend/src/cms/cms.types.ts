export type LocaleText = { fr?: string; en?: string; es?: string };

export type CmsMediaRow = {
  id: string;
  storagePath: string | null;
  publicUrl: string | null;
  mimeType: string;
  altFr: string | null;
  altEn: string | null;
  altEs: string | null;
};

export type CmsDoctorRow = {
  id: string;
  slug: string;
  sortOrder: number;
  avatarMediaId: string | null;
  nameFr: string | null;
  nameEn: string | null;
  nameEs: string | null;
  roleFr: string | null;
  roleEn: string | null;
  roleEs: string | null;
  bioFr: string | null;
  bioEn: string | null;
  bioEs: string | null;
  illustrationNote: string | null;
  published: boolean;
  updatedAt: string;
};

export type CmsServiceRow = {
  id: string;
  slug: string;
  sortOrder: number;
  titleFr: string | null;
  titleEn: string | null;
  titleEs: string | null;
  bodyFr: string | null;
  bodyEn: string | null;
  bodyEs: string | null;
  published: boolean;
  updatedAt: string;
};

export type CmsTestimonialRow = {
  id: string;
  sortOrder: number;
  avatarMediaId: string | null;
  authorFr: string | null;
  authorEn: string | null;
  authorEs: string | null;
  quoteFr: string | null;
  quoteEn: string | null;
  quoteEs: string | null;
  published: boolean;
  updatedAt: string;
};

export type CmsHomeSectionRow = {
  id: string;
  sortOrder: number;
  sectionType: string;
  payload: Record<string, unknown>;
  published: boolean;
  updatedAt: string;
};

export type CmsBlogPostRow = {
  id: string;
  slug: string;
  datePublished: string | null;
  titleFr: string | null;
  titleEn: string | null;
  titleEs: string | null;
  excerptFr: string | null;
  excerptEn: string | null;
  excerptEs: string | null;
  bodyFr: string | null;
  bodyEn: string | null;
  bodyEs: string | null;
  published: boolean;
  updatedAt: string;
};

export type CmsBundle = {
  doctors: CmsDoctorRow[];
  services: CmsServiceRow[];
  testimonials: CmsTestimonialRow[];
  homeSections: CmsHomeSectionRow[];
  blogPosts: CmsBlogPostRow[];
  media: CmsMediaRow[];
  tag: string;
};
