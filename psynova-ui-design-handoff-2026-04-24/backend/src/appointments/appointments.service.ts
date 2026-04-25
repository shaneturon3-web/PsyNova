import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { TranslationService } from '../translation/translation.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';

type Appointment = {
  id: string;
  patientId: string;
  clinicianId: string;
  startsAt: string;
  endsAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  serviceCategory: string | null;
  createdAt: string;
  sessionNotesOriginal: string | null;
  sessionNotesClientLanguage: string | null;
  sessionNotesInternalFr: string | null;
  sessionNotesTranslationProvider: string | null;
};

@Injectable()
export class AppointmentsService {
  private readonly appointments = new Map<string, Appointment>();
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly translation: TranslationService,
  ) {}

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
}
