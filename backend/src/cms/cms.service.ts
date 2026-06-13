import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseService } from '../database/database.service';
import { cloneCmsMemory } from './cms-seed.data';
import type {
  CmsBlogPostRow,
  CmsBundle,
  CmsDoctorRow,
  CmsHomeSectionRow,
  CmsMediaRow,
  CmsServiceRow,
  CmsTestimonialRow,
} from './cms.types';

type MemoryState = ReturnType<typeof cloneCmsMemory>;

function mapMedia(r: Record<string, unknown>): CmsMediaRow {
  return {
    id: String(r.id),
    storagePath: (r.storage_path as string) ?? null,
    publicUrl: (r.public_url as string) ?? null,
    mimeType: String(r.mime_type ?? 'application/octet-stream'),
    altFr: (r.alt_fr as string) ?? null,
    altEn: (r.alt_en as string) ?? null,
    altEs: (r.alt_es as string) ?? null,
  };
}

function mapDoctor(r: Record<string, unknown>): CmsDoctorRow {
  return {
    id: String(r.id),
    slug: String(r.slug),
    sortOrder: Number(r.sort_order ?? 0),
    avatarMediaId: (r.avatar_media_id as string) ?? null,
    nameFr: (r.name_fr as string) ?? null,
    nameEn: (r.name_en as string) ?? null,
    nameEs: (r.name_es as string) ?? null,
    roleFr: (r.role_fr as string) ?? null,
    roleEn: (r.role_en as string) ?? null,
    roleEs: (r.role_es as string) ?? null,
    bioFr: (r.bio_fr as string) ?? null,
    bioEn: (r.bio_en as string) ?? null,
    bioEs: (r.bio_es as string) ?? null,
    illustrationNote: (r.illustration_note as string) ?? null,
    published: Boolean(r.published),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapService(r: Record<string, unknown>): CmsServiceRow {
  return {
    id: String(r.id),
    slug: String(r.slug),
    sortOrder: Number(r.sort_order ?? 0),
    titleFr: (r.title_fr as string) ?? null,
    titleEn: (r.title_en as string) ?? null,
    titleEs: (r.title_es as string) ?? null,
    bodyFr: (r.body_fr as string) ?? null,
    bodyEn: (r.body_en as string) ?? null,
    bodyEs: (r.body_es as string) ?? null,
    published: Boolean(r.published),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapTestimonial(r: Record<string, unknown>): CmsTestimonialRow {
  return {
    id: String(r.id),
    sortOrder: Number(r.sort_order ?? 0),
    avatarMediaId: (r.avatar_media_id as string) ?? null,
    authorFr: (r.author_fr as string) ?? null,
    authorEn: (r.author_en as string) ?? null,
    authorEs: (r.author_es as string) ?? null,
    quoteFr: (r.quote_fr as string) ?? null,
    quoteEn: (r.quote_en as string) ?? null,
    quoteEs: (r.quote_es as string) ?? null,
    published: Boolean(r.published),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapHome(r: Record<string, unknown>): CmsHomeSectionRow {
  const payload = r.payload;
  return {
    id: String(r.id),
    sortOrder: Number(r.sort_order ?? 0),
    sectionType: String(r.section_type),
    payload:
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {},
    published: Boolean(r.published),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function mapBlog(r: Record<string, unknown>): CmsBlogPostRow {
  const d = r.date_published;
  return {
    id: String(r.id),
    slug: String(r.slug),
    datePublished: d ? String(d).slice(0, 10) : null,
    titleFr: (r.title_fr as string) ?? null,
    titleEn: (r.title_en as string) ?? null,
    titleEs: (r.title_es as string) ?? null,
    excerptFr: (r.excerpt_fr as string) ?? null,
    excerptEn: (r.excerpt_en as string) ?? null,
    excerptEs: (r.excerpt_es as string) ?? null,
    bodyFr: (r.body_fr as string) ?? null,
    bodyEn: (r.body_en as string) ?? null,
    bodyEs: (r.body_es as string) ?? null,
    published: Boolean(r.published),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

function filterPublished<T extends { published: boolean }>(rows: T[], includeDrafts: boolean): T[] {
  return includeDrafts ? [...rows] : rows.filter((x) => x.published);
}

@Injectable()
export class CmsService {
  private mem: MemoryState | null = null;

  constructor(private readonly db: DatabaseService) {}

  private ensureMem(): MemoryState {
    if (!this.mem) {
      this.mem = cloneCmsMemory();
    }
    return this.mem;
  }

  private uploadDir(): string {
    return process.env.CMS_UPLOAD_DIR || join(process.cwd(), 'uploads', 'cms');
  }

  async getBundle(includeDrafts: boolean): Promise<CmsBundle> {
    if (this.db.isEnabled()) {
      return this.getBundleFromDb(includeDrafts);
    }
    const m = this.ensureMem();
    const tag = 'MOCKUP-PURPOSE-ONLY';
    return {
      doctors: filterPublished(m.doctors, includeDrafts).sort((a, b) => a.sortOrder - b.sortOrder),
      services: filterPublished(m.services, includeDrafts).sort((a, b) => a.sortOrder - b.sortOrder),
      testimonials: filterPublished(m.testimonials, includeDrafts).sort((a, b) => a.sortOrder - b.sortOrder),
      homeSections: filterPublished(m.homeSections, includeDrafts).sort((a, b) => a.sortOrder - b.sortOrder),
      blogPosts: filterPublished(m.blogPosts, includeDrafts).sort((a, b) => {
        const da = a.datePublished || '';
        const db = b.datePublished || '';
        return db.localeCompare(da);
      }),
      media: [...m.media],
      tag,
    };
  }

  private async getBundleFromDb(includeDrafts: boolean): Promise<CmsBundle> {
    const pub = includeDrafts ? '' : 'WHERE published = true';
    const media = await this.db.query(`SELECT * FROM cms_media ORDER BY created_at ASC`);
    const doctors = await this.db.query(`SELECT * FROM cms_doctors ${pub} ORDER BY sort_order ASC`);
    const services = await this.db.query(`SELECT * FROM cms_services ${pub} ORDER BY sort_order ASC`);
    const testimonials = await this.db.query(`SELECT * FROM cms_testimonials ${pub} ORDER BY sort_order ASC`);
    const homeSections = await this.db.query(`SELECT * FROM cms_home_sections ${pub} ORDER BY sort_order ASC`);
    const blogPosts = await this.db.query(
      `SELECT * FROM cms_blog_posts ${pub} ORDER BY date_published DESC NULLS LAST`,
    );
    const tag = 'MOCKUP-PURPOSE-ONLY';
    return {
      doctors: doctors.rows.map(mapDoctor),
      services: services.rows.map(mapService),
      testimonials: testimonials.rows.map(mapTestimonial),
      homeSections: homeSections.rows.map(mapHome),
      blogPosts: blogPosts.rows.map(mapBlog),
      media: media.rows.map(mapMedia),
      tag,
    };
  }

  async getMediaById(id: string): Promise<CmsMediaRow | null> {
    if (this.db.isEnabled()) {
      const r = await this.db.query(`SELECT * FROM cms_media WHERE id = $1`, [id]);
      return r.rows[0] ? mapMedia(r.rows[0] as Record<string, unknown>) : null;
    }
    return this.ensureMem().media.find((x) => x.id === id) ?? null;
  }

  async saveUploadedMedia(opts: {
    originalName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<CmsMediaRow> {
    const dir = this.uploadDir();
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const id = randomUUID();
    const safe = opts.originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const rel = `uploads/cms/${id}-${safe}`;
    const abs = join(process.cwd(), rel);
    await writeFile(abs, opts.buffer);
    const row: CmsMediaRow = {
      id,
      storagePath: rel,
      publicUrl: null,
      mimeType: opts.mimeType || 'application/octet-stream',
      altFr: null,
      altEn: null,
      altEs: null,
    };
    if (this.db.isEnabled()) {
      await this.db.query(
        `INSERT INTO cms_media (id, storage_path, mime_type) VALUES ($1, $2, $3)`,
        [row.id, row.storagePath, row.mimeType],
      );
    } else {
      this.ensureMem().media.push(row);
    }
    return row;
  }

  async patchField(body: { target: string; id: string; field: string; value: unknown }) {
    const { target, id, field, value } = body;
    const allowed: Record<string, Set<string>> = {
      doctor: new Set([
        'nameFr',
        'nameEn',
        'nameEs',
        'roleFr',
        'roleEn',
        'roleEs',
        'bioFr',
        'bioEn',
        'bioEs',
        'illustrationNote',
        'slug',
        'published',
        'sortOrder',
        'avatarMediaId',
      ]),
      service: new Set([
        'titleFr',
        'titleEn',
        'titleEs',
        'bodyFr',
        'bodyEn',
        'bodyEs',
        'slug',
        'published',
        'sortOrder',
      ]),
      testimonial: new Set([
        'authorFr',
        'authorEn',
        'authorEs',
        'quoteFr',
        'quoteEn',
        'quoteEs',
        'published',
        'sortOrder',
        'avatarMediaId',
      ]),
      blogPost: new Set([
        'titleFr',
        'titleEn',
        'titleEs',
        'excerptFr',
        'excerptEn',
        'excerptEs',
        'bodyFr',
        'bodyEn',
        'bodyEs',
        'slug',
        'datePublished',
        'published',
      ]),
      media: new Set(['altFr', 'altEn', 'altEs']),
    };
    const set = allowed[target];
    if (!set || !set.has(field)) {
      throw new BadRequestException('Invalid target or field');
    }
    if (this.db.isEnabled()) {
      await this.patchFieldDb(target, id, field, value);
    } else {
      this.patchFieldMem(target, id, field, value);
    }
    return { ok: true };
  }

  private patchFieldMem(target: string, id: string, field: string, value: unknown) {
    const m = this.ensureMem();
    const ts = new Date().toISOString();
    const str = (v: unknown) => (v == null ? null : String(v));
    const bool = (v: unknown) => Boolean(v);
    const num = (v: unknown) => Number(v);
    if (target === 'doctor') {
      const row = m.doctors.find((x) => x.id === id);
      if (!row) throw new NotFoundException();
      const k = field as keyof CmsDoctorRow;
      if (k === 'published') row.published = bool(value);
      else if (k === 'sortOrder') row.sortOrder = num(value);
      else if (k === 'avatarMediaId') row.avatarMediaId = str(value);
      else (row as Record<string, unknown>)[k] = value;
      row.updatedAt = ts;
      return;
    }
    if (target === 'service') {
      const row = m.services.find((x) => x.id === id);
      if (!row) throw new NotFoundException();
      const k = field as keyof CmsServiceRow;
      if (k === 'published') row.published = bool(value);
      else if (k === 'sortOrder') row.sortOrder = num(value);
      else (row as Record<string, unknown>)[k] = value;
      row.updatedAt = ts;
      return;
    }
    if (target === 'testimonial') {
      const row = m.testimonials.find((x) => x.id === id);
      if (!row) throw new NotFoundException();
      const k = field as keyof CmsTestimonialRow;
      if (k === 'published') row.published = bool(value);
      else if (k === 'sortOrder') row.sortOrder = num(value);
      else if (k === 'avatarMediaId') row.avatarMediaId = str(value);
      else (row as Record<string, unknown>)[k] = value;
      row.updatedAt = ts;
      return;
    }
    if (target === 'blogPost') {
      const row = m.blogPosts.find((x) => x.id === id);
      if (!row) throw new NotFoundException();
      const k = field as keyof CmsBlogPostRow;
      if (k === 'published') row.published = bool(value);
      else if (k === 'datePublished') row.datePublished = str(value);
      else (row as Record<string, unknown>)[k] = value;
      row.updatedAt = ts;
      return;
    }
    if (target === 'media') {
      const row = m.media.find((x) => x.id === id);
      if (!row) throw new NotFoundException();
      const k = field as keyof CmsMediaRow;
      (row as Record<string, unknown>)[k] = value;
    }
  }

  private async patchFieldDb(target: string, id: string, field: string, value: unknown) {
    const colMap: Record<string, Record<string, string>> = {
      doctor: {
        nameFr: 'name_fr',
        nameEn: 'name_en',
        nameEs: 'name_es',
        roleFr: 'role_fr',
        roleEn: 'role_en',
        roleEs: 'role_es',
        bioFr: 'bio_fr',
        bioEn: 'bio_en',
        bioEs: 'bio_es',
        illustrationNote: 'illustration_note',
        slug: 'slug',
        published: 'published',
        sortOrder: 'sort_order',
        avatarMediaId: 'avatar_media_id',
      },
      service: {
        titleFr: 'title_fr',
        titleEn: 'title_en',
        titleEs: 'title_es',
        bodyFr: 'body_fr',
        bodyEn: 'body_en',
        bodyEs: 'body_es',
        slug: 'slug',
        published: 'published',
        sortOrder: 'sort_order',
      },
      testimonial: {
        authorFr: 'author_fr',
        authorEn: 'author_en',
        authorEs: 'author_es',
        quoteFr: 'quote_fr',
        quoteEn: 'quote_en',
        quoteEs: 'quote_es',
        published: 'published',
        sortOrder: 'sort_order',
        avatarMediaId: 'avatar_media_id',
      },
      blogPost: {
        titleFr: 'title_fr',
        titleEn: 'title_en',
        titleEs: 'title_es',
        excerptFr: 'excerpt_fr',
        excerptEn: 'excerpt_en',
        excerptEs: 'excerpt_es',
        bodyFr: 'body_fr',
        bodyEn: 'body_en',
        bodyEs: 'body_es',
        slug: 'slug',
        datePublished: 'date_published',
        published: 'published',
      },
      media: {
        altFr: 'alt_fr',
        altEn: 'alt_en',
        altEs: 'alt_es',
      },
    };
    const tableMap: Record<string, string> = {
      doctor: 'cms_doctors',
      service: 'cms_services',
      testimonial: 'cms_testimonials',
      blogPost: 'cms_blog_posts',
      media: 'cms_media',
    };
    const table = tableMap[target];
    const cmap = colMap[target];
    if (!table || !cmap) throw new BadRequestException();
    const col = cmap[field];
    if (!col) throw new BadRequestException();
    let v: unknown = value;
    if (field === 'published') v = Boolean(value);
    if (field === 'sortOrder') v = Number(value);
    if (target === 'media') {
      await this.db.query(`UPDATE ${table} SET ${col} = $1 WHERE id = $2`, [v, id]);
    } else {
      await this.db.query(
        `UPDATE ${table} SET ${col} = $1, updated_at = NOW() WHERE id = $2`,
        [v, id],
      );
    }
  }

  async upsertHomeSection(body: {
    id?: string;
    sortOrder?: number;
    sectionType: string;
    payload: Record<string, unknown>;
    published?: boolean;
  }) {
    const id = body.id || randomUUID();
    const sortOrder = body.sortOrder ?? 0;
    const published = body.published ?? false;
    if (this.db.isEnabled()) {
      await this.db.query(
        `INSERT INTO cms_home_sections (id, sort_order, section_type, payload, published)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         ON CONFLICT (id) DO UPDATE SET
           sort_order = EXCLUDED.sort_order,
           section_type = EXCLUDED.section_type,
           payload = EXCLUDED.payload,
           published = EXCLUDED.published,
           updated_at = NOW()`,
        [id, sortOrder, body.sectionType, JSON.stringify(body.payload), published],
      );
    } else {
      const m = this.ensureMem();
      const idx = m.homeSections.findIndex((x) => x.id === id);
      const row: CmsHomeSectionRow = {
        id,
        sortOrder,
        sectionType: body.sectionType,
        payload: body.payload,
        published,
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) m.homeSections[idx] = row;
      else m.homeSections.push(row);
    }
    return { id };
  }

  async deleteHomeSection(id: string) {
    if (this.db.isEnabled()) {
      await this.db.query(`DELETE FROM cms_home_sections WHERE id = $1`, [id]);
    } else {
      const m = this.ensureMem();
      m.homeSections = m.homeSections.filter((x) => x.id !== id);
    }
    return { ok: true };
  }

  async replaceDoctorAvatar(doctorId: string, mediaId: string) {
    return this.patchField({ target: 'doctor', id: doctorId, field: 'avatarMediaId', value: mediaId });
  }

  async replaceTestimonialAvatar(testimonialId: string, mediaId: string) {
    return this.patchField({
      target: 'testimonial',
      id: testimonialId,
      field: 'avatarMediaId',
      value: mediaId,
    });
  }
}
