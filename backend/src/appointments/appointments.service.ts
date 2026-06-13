import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { TranslationService } from '../translation/translation.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

/**
 * Mockup-only placeholder clinician id used by the booking wizard when no real clinician
 * has been picked yet. MUST match `MOCK_CLINICIAN_ID` in:
 *   - app/frontend/src/app-legacy.js
 *   - app/frontend/src/compliance-gateway.js
 * Seeded into `users` at boot so `appointments.clinician_id_fkey` is always satisfiable.
 */
const MOCK_CLINICIAN_ID = '00000000-0000-4000-8000-000000000001';
const MOCK_CLINICIAN_EMAIL = 'mock.clinician@psynova.local';

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

type Appointment = {
  id: string;
  patientId: string;
  clinicianId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  serviceCategory: string | null;
  createdAt: string;
  sessionNotesOriginal: string | null;
  sessionNotesClientLanguage: string | null;
  sessionNotesInternalFr: string | null;
  sessionNotesTranslationProvider: string | null;
};

@Injectable()
export class AppointmentsService implements OnModuleInit {
  private readonly logger = new Logger(AppointmentsService.name);
  private readonly appointments = new Map<string, Appointment>();
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly translation: TranslationService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.databaseService.isEnabled()) {
      return;
    }
    try {
      // Idempotent seed: ensures the booking wizard's hardcoded MOCK_CLINICIAN_ID
      // satisfies appointments.clinician_id_fkey on a fresh DB. password_hash is a
      // non-verifiable sentinel; this row cannot be logged into.
      await this.databaseService.query(
        `INSERT INTO users (id, role, preferred_language, email, password_hash)
         VALUES ($1, 'clinician', 'en', $2, 'MOCKUP-NOT-LOGINABLE')
         ON CONFLICT (id) DO NOTHING`,
        [MOCK_CLINICIAN_ID, MOCK_CLINICIAN_EMAIL],
      );
      this.logger.log(`[seed] mock clinician ensured id=${MOCK_CLINICIAN_ID}`);
    } catch (error) {
      this.logger.warn(
        `[seed] mock clinician seed skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async create(payload: CreateAppointmentDto) {
    let notesOriginal: string | null = null;
    let notesLang: string | null = null;
    let notesFr: string | null = null;
    let notesProvider: string | null = null;

    if (payload.sessionNotes?.trim()) {
      notesOriginal = payload.sessionNotes.trim();
      notesLang = payload.sessionNotesClientLanguage || 'fr';
      const tr = await this.translation.translateToFrench(notesOriginal, notesLang);
      notesFr = tr.text;
      notesProvider = tr.provider;
    }

    const appointment: Appointment = {
      id: randomUUID(),
      patientId: payload.patientId,
      clinicianId: payload.clinicianId,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      status: payload.status,
      serviceCategory: payload.serviceCategory ?? null,
      createdAt: new Date().toISOString(),
      sessionNotesOriginal: notesOriginal,
      sessionNotesClientLanguage: notesLang,
      sessionNotesInternalFr: notesFr,
      sessionNotesTranslationProvider: notesProvider,
    };

    if (this.databaseService.isEnabled()) {
      await this.databaseService.query(
        `INSERT INTO appointments (id, patient_id, clinician_id, starts_at, ends_at, status, service_category,
          session_notes_original, session_notes_client_language, session_notes_internal_fr, session_notes_translation_provider)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          appointment.id,
          appointment.patientId,
          appointment.clinicianId,
          appointment.startsAt,
          appointment.endsAt,
          appointment.status,
          appointment.serviceCategory,
          appointment.sessionNotesOriginal,
          appointment.sessionNotesClientLanguage,
          appointment.sessionNotesInternalFr,
          appointment.sessionNotesTranslationProvider,
        ],
      );
    }
    this.appointments.set(appointment.id, appointment);
    return {
      appointment: this.toPublicAppointment(appointment),
      tag: '[DRAFT]',
    };
  }

  /** Patient-facing list: show original notes only; internal FR omitted here for privacy in mockup. */
  private toPublicAppointment(a: Appointment) {
    return {
      id: a.id,
      patientId: a.patientId,
      clinicianId: a.clinicianId,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      status: a.status,
      serviceCategory: a.serviceCategory,
      createdAt: a.createdAt,
      sessionNotesOriginal: a.sessionNotesOriginal,
      sessionNotesClientLanguage: a.sessionNotesClientLanguage,
    };
  }

  private mapRow(row: Record<string, unknown>): Appointment {
    return {
      id: String(row.id),
      patientId: String(row.patient_id),
      clinicianId: String(row.clinician_id),
      startsAt: String(row.starts_at),
      endsAt: String(row.ends_at),
      status: row.status as Appointment['status'],
      serviceCategory: (row.service_category as string) ?? null,
      createdAt: String(row.created_at),
      sessionNotesOriginal: (row.session_notes_original as string) ?? null,
      sessionNotesClientLanguage: (row.session_notes_client_language as string) ?? null,
      sessionNotesInternalFr: (row.session_notes_internal_fr as string) ?? null,
      sessionNotesTranslationProvider: (row.session_notes_translation_provider as string) ?? null,
    };
  }

  async findAll(query: ListAppointmentsQueryDto) {
    if (this.databaseService.isEnabled()) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (query.patientId) {
        params.push(query.patientId);
        where.push(`patient_id = $${params.length}`);
      }
      if (query.clinicianId) {
        params.push(query.clinicianId);
        where.push(`clinician_id = $${params.length}`);
      }
      if (query.status) {
        params.push(query.status);
        where.push(`status = $${params.length}`);
      }
      const sql = `SELECT id, patient_id, clinician_id, starts_at, ends_at, status, service_category, created_at,
                          session_notes_original, session_notes_client_language, session_notes_internal_fr, session_notes_translation_provider
                   FROM appointments
                   ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                   ORDER BY created_at DESC`;
      const result = await this.databaseService.query(sql, params);

      const items = result.rows.map((row) => this.toPublicAppointment(this.mapRow(row as Record<string, unknown>)));
      return { items, count: items.length };
    }

    const items = [...this.appointments.values()]
      .filter((item) => {
        if (query.patientId && item.patientId !== query.patientId) return false;
        if (query.clinicianId && item.clinicianId !== query.clinicianId) return false;
        if (query.status && item.status !== query.status) return false;
        return true;
      })
      .map((a) => this.toPublicAppointment(a));
    return { items, count: items.length };
  }

  async findOne(id: string) {
    if (this.databaseService.isEnabled()) {
      const result = await this.databaseService.query(
        `SELECT id, patient_id, clinician_id, starts_at, ends_at, status, service_category, created_at,
                session_notes_original, session_notes_client_language, session_notes_internal_fr, session_notes_translation_provider
         FROM appointments WHERE id = $1`,
        [id],
      );

      if (!result.rows[0]) {
        throw new NotFoundException('Appointment not found');
      }

      return this.toPublicAppointment(this.mapRow(result.rows[0] as Record<string, unknown>));
    }

    const appointment = this.appointments.get(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return this.toPublicAppointment(appointment);
  }

  /**
   * PATCH /api/appointments/:id/status — transition an appointment to a new status.
   * On `cancelled`, the optional `reason` is appended to `session_notes_internal_fr` so the
   * cancellation context is preserved without adding a new column. Idempotent for repeats.
   */
  async updateStatus(id: string, payload: UpdateAppointmentStatusDto) {
    this.logger.log(`[appointments.updateStatus] id=${id} status=${payload.status}`);
    const reasonNote =
      payload.status === 'cancelled' && payload.reason?.trim()
        ? `\n[cancelled ${new Date().toISOString()}] ${payload.reason.trim()}`
        : '';

    if (this.databaseService.isEnabled()) {
      // CONCAT NULL-safe via COALESCE so the first cancellation reason still survives.
      const result = await this.databaseService.query(
        `UPDATE appointments
         SET status = $2,
             session_notes_internal_fr = CASE
               WHEN $3::text <> '' THEN COALESCE(session_notes_internal_fr, '') || $3::text
               ELSE session_notes_internal_fr
             END
         WHERE id = $1
         RETURNING id, patient_id, clinician_id, starts_at, ends_at, status, service_category, created_at,
                   session_notes_original, session_notes_client_language, session_notes_internal_fr, session_notes_translation_provider`,
        [id, payload.status, reasonNote],
      );
      if (!result.rows[0]) {
        throw new NotFoundException('Appointment not found');
      }
      const updated = this.mapRow(result.rows[0] as Record<string, unknown>);
      // Keep the in-memory mirror consistent for the no-DB path.
      this.appointments.set(updated.id, updated);
      return { appointment: this.toPublicAppointment(updated), tag: '[DRAFT]' };
    }

    const appointment = this.appointments.get(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    appointment.status = payload.status;
    if (reasonNote) {
      appointment.sessionNotesInternalFr = `${appointment.sessionNotesInternalFr ?? ''}${reasonNote}`;
    }
    return { appointment: this.toPublicAppointment(appointment), tag: '[DRAFT]' };
  }
}
