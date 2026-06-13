import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { DatabaseService } from '../database/database.service';
import { AuditService } from './audit.service';
import { CreateNoteDto, ListNotesQueryDto, UpdateNoteDto } from './dto/create-note.dto';
import { CreateConsentDto } from './dto/create-consent.dto';

const TAG = 'MOCKUP-PURPOSE-ONLY';

export type AttachmentUpload = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

/**
 * Clinical Records — patient charts, SOAP/progress/assessment/intake notes (with revisions
 * and HMAC-signed locking), consents, file attachments, and a verifier that walks the
 * append-only audit chain. All writes also append an audit_events row.
 */
@Injectable()
export class ClinicalRecordsService {
  private readonly logger = new Logger(ClinicalRecordsService.name);
  constructor(private readonly db: DatabaseService, private readonly audit: AuditService) {}

  // ---------- Notes ----------

  async createNote(dto: CreateNoteDto, actorId?: string) {
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO clinical_notes (id, patient_id, clinician_id, appointment_id, note_type, title, body, subjective, objective, assessment, plan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, dto.patientId, dto.clinicianId, dto.appointmentId ?? null, dto.noteType, dto.title ?? null, dto.body ?? null, dto.subjective ?? null, dto.objective ?? null, dto.assessment ?? null, dto.plan ?? null],
    );
    await this.audit.append(actorId, 'note', id, 'note.created', { type: dto.noteType, patientId: dto.patientId });
    return { note: await this.findNote(id), tag: TAG };
  }

  async findNote(id: string) {
    const r = await this.db.query('SELECT * FROM clinical_notes WHERE id = $1', [id]);
    if (!r.rows[0]) throw new NotFoundException('Note not found');
    return this.publicNote(r.rows[0]);
  }

  async listNotes(q: ListNotesQueryDto) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (q.patientId) { params.push(q.patientId); where.push(`patient_id = $${params.length}`); }
    if (q.clinicianId) { params.push(q.clinicianId); where.push(`clinician_id = $${params.length}`); }
    if (q.noteType) { params.push(q.noteType); where.push(`note_type = $${params.length}`); }
    const sql = `SELECT * FROM clinical_notes ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 200`;
    const r = await this.db.query(sql, params);
    return { items: r.rows.map((row) => this.publicNote(row)), count: r.rows.length, tag: TAG };
  }

  async updateNote(id: string, dto: UpdateNoteDto, actorId?: string) {
    const cur = await this.db.query('SELECT * FROM clinical_notes WHERE id = $1', [id]);
    if (!cur.rows[0]) throw new NotFoundException('Note not found');
    if (cur.rows[0].signed_at) {
      throw new ConflictException('Note is signed and locked');
    }
    if (!actorId) throw new BadRequestException('actorId required');
    const next = { ...cur.rows[0], ...this.mapUpdate(dto) };
    const revCount = await this.db.query('SELECT COUNT(*)::int AS n FROM note_revisions WHERE note_id = $1', [id]);
    const revisionNumber = (revCount.rows[0].n as number) + 1;
    await this.db.query(
      `INSERT INTO note_revisions (id, note_id, editor_id, revision_number, body_snapshot)
       VALUES (gen_random_uuid(), $1, $2, $3, $4::jsonb)`,
      [id, actorId, revisionNumber, JSON.stringify(this.snapshot(cur.rows[0]))],
    );
    await this.db.query(
      `UPDATE clinical_notes SET title = $2, body = $3, subjective = $4, objective = $5, assessment = $6, plan = $7, updated_at = NOW() WHERE id = $1`,
      [id, next.title, next.body, next.subjective, next.objective, next.assessment, next.plan],
    );
    await this.audit.append(actorId, 'note', id, 'note.updated', { revision: revisionNumber });
    return { note: await this.findNote(id), revisionNumber, tag: TAG };
  }

  async signNote(id: string, actorId?: string) {
    if (!actorId) throw new BadRequestException('actorId required');
    const cur = await this.db.query('SELECT * FROM clinical_notes WHERE id = $1', [id]);
    if (!cur.rows[0]) throw new NotFoundException('Note not found');
    if (cur.rows[0].signed_at) {
      return { note: this.publicNote(cur.rows[0]), notice: 'Already signed', tag: TAG };
    }
    const secret = String(process.env.AUDIT_LOG_HMAC_SECRET ?? 'psynova-dev-fallback-key').trim();
    const canonical = JSON.stringify(this.snapshot(cur.rows[0]));
    const sig = createHmac('sha256', secret).update(canonical).digest('hex');
    await this.db.query(
      'UPDATE clinical_notes SET signed_at = NOW(), signed_by = $2, signature_hash = $3, updated_at = NOW() WHERE id = $1',
      [id, actorId, sig],
    );
    await this.audit.append(actorId, 'note', id, 'note.signed', { signatureHash: sig });
    return { note: await this.findNote(id), tag: TAG };
  }

  async noteRevisions(id: string) {
    const r = await this.db.query('SELECT id, editor_id, revision_number, body_snapshot, created_at FROM note_revisions WHERE note_id = $1 ORDER BY revision_number DESC', [id]);
    return { items: r.rows, tag: TAG };
  }

  async notePdf(id: string): Promise<Buffer> {
    const note = await this.findNote(id);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(18).text(`PsyNova — ${note.noteType.toUpperCase()} note`);
      doc.fontSize(9).fillColor('#888').text('[MOCKUP PURPOSE ONLY — NOT A LEGAL HEALTH RECORD]');
      doc.moveDown();
      doc.fillColor('#000').fontSize(10);
      doc.text(`Note ID: ${note.id}`);
      doc.text(`Patient: ${note.patientId}`);
      doc.text(`Clinician: ${note.clinicianId}`);
      doc.text(`Created: ${note.createdAt}`);
      doc.text(`Signed: ${note.signedAt ?? '(unsigned)'}`);
      if (note.signatureHash) doc.text(`Signature: ${note.signatureHash.slice(0, 24)}...`);
      doc.moveDown();
      if (note.noteType === 'soap') {
        for (const [k, v] of [['Subjective', note.subjective], ['Objective', note.objective], ['Assessment', note.assessment], ['Plan', note.plan]]) {
          if (v) { doc.fontSize(12).text(String(k), { underline: true }); doc.fontSize(10).text(String(v)); doc.moveDown(); }
        }
      } else {
        if (note.title) doc.fontSize(13).text(String(note.title));
        if (note.body) doc.fontSize(10).text(String(note.body));
      }
      doc.end();
    });
  }

  // ---------- Chart composite ----------

  async chart(patientId: string) {
    const notes = await this.db.query('SELECT * FROM clinical_notes WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 50', [patientId]);
    const consents = await this.db.query('SELECT * FROM consents WHERE patient_id = $1 ORDER BY accepted_at DESC', [patientId]);
    const attachments = await this.db.query('SELECT id, filename, mime_type, byte_size, created_at FROM attachments WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 50', [patientId]);
    return {
      patientId,
      notes: notes.rows.map((row) => this.publicNote(row)),
      consents: consents.rows,
      attachments: attachments.rows,
      tag: TAG,
    };
  }

  // ---------- Consents ----------

  async listConsents(patientId: string) {
    const r = await this.db.query('SELECT * FROM consents WHERE patient_id = $1 ORDER BY accepted_at DESC', [patientId]);
    return { items: r.rows, count: r.rows.length, tag: TAG };
  }

  async createConsent(dto: CreateConsentDto, ip?: string, userAgent?: string, actorId?: string) {
    await this.db.query(
      `INSERT INTO consents (id, patient_id, consent_type, consent_version, accepted, accepted_ip, accepted_user_agent, notes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (patient_id, consent_type, consent_version) DO UPDATE
         SET accepted = EXCLUDED.accepted, accepted_at = NOW(), accepted_ip = EXCLUDED.accepted_ip, accepted_user_agent = EXCLUDED.accepted_user_agent, notes = EXCLUDED.notes`,
      [dto.patientId, dto.consentType, dto.consentVersion, dto.accepted ?? true, ip ?? null, userAgent ?? null, dto.notes ?? null],
    );
    await this.audit.append(actorId, 'consent', dto.patientId, 'consent.recorded', { type: dto.consentType, version: dto.consentVersion, accepted: dto.accepted ?? true });
    return { ok: true, tag: TAG };
  }

  // ---------- Attachments ----------

  async addAttachment(patientId: string, file: AttachmentUpload, noteId: string | undefined, uploaderId: string) {
    if (!file?.buffer?.length) throw new BadRequestException('file required');
    const dir = String(process.env.ATTACHMENTS_DIR ?? path.resolve(process.cwd(), '..', 'uploads', 'clinical')).trim();
    await mkdir(dir, { recursive: true });
    const id = randomUUID();
    const safeName = file.originalname.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) || 'attachment.bin';
    const storagePath = path.join(dir, `${id}-${safeName}`);
    await writeFile(storagePath, file.buffer);
    const sha = createHash('sha256').update(file.buffer).digest('hex');
    await this.db.query(
      `INSERT INTO attachments (id, patient_id, uploader_id, note_id, filename, mime_type, byte_size, storage_path, sha256)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, patientId, uploaderId, noteId ?? null, safeName, file.mimetype || 'application/octet-stream', file.buffer.length, storagePath, sha],
    );
    await this.audit.append(uploaderId, 'attachment', id, 'attachment.uploaded', { patientId, bytes: file.buffer.length, sha });
    return { id, filename: safeName, byteSize: file.buffer.length, sha256: sha, tag: TAG };
  }

  async getAttachmentBytes(id: string): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const r = await this.db.query('SELECT filename, mime_type, storage_path FROM attachments WHERE id = $1', [id]);
    if (!r.rows[0]) throw new NotFoundException('Attachment not found');
    const buffer = await readFile(r.rows[0].storage_path);
    return { buffer, mimeType: r.rows[0].mime_type, filename: r.rows[0].filename };
  }

  // ---------- Audit ----------

  async listAudit(filters: { actorId?: string; entityId?: string; entityType?: string; from?: string; to?: string }) {
    return this.audit.list(filters);
  }

  async verifyAudit() {
    return this.audit.verify();
  }

  // ---------- mappers ----------

  private publicNote(row: any) {
    return {
      id: row.id,
      patientId: row.patient_id,
      clinicianId: row.clinician_id,
      appointmentId: row.appointment_id,
      noteType: row.note_type,
      title: row.title,
      body: row.body,
      subjective: row.subjective,
      objective: row.objective,
      assessment: row.assessment,
      plan: row.plan,
      signedAt: row.signed_at,
      signedBy: row.signed_by,
      signatureHash: row.signature_hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private snapshot(row: any) {
    return { title: row.title, body: row.body, subjective: row.subjective, objective: row.objective, assessment: row.assessment, plan: row.plan };
  }

  private mapUpdate(dto: UpdateNoteDto) {
    return {
      title: dto.title,
      body: dto.body,
      subjective: dto.subjective,
      objective: dto.objective,
      assessment: dto.assessment,
      plan: dto.plan,
    };
  }
}
