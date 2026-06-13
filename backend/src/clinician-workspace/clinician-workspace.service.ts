import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../clinical-records/audit.service';
import { CreateAvailabilityDto } from './dto/availability.dto';
import { CreateTreatmentPlanDto, UpdateTreatmentPlanDto } from './dto/treatment-plan.dto';
import { CreateMessageDto, CreateThreadDto } from './dto/messaging.dto';

const TAG = 'MOCKUP-PURPOSE-ONLY';

/**
 * Clinician Workspace — caseload dashboard, availability blocks, treatment plans + goals,
 * in-DB secure messaging (no external chat vendor), and a deterministic CDS rule engine.
 */
@Injectable()
export class ClinicianWorkspaceService {
  private readonly logger = new Logger(ClinicianWorkspaceService.name);
  constructor(private readonly db: DatabaseService, private readonly audit: AuditService) {}

  // ---------- Dashboard ----------

  async dashboard(clinicianId: string) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    const caseload = await this.db.query(
      `SELECT id, patient_id, starts_at, ends_at, status, service_category
       FROM appointments WHERE clinician_id = $1 AND starts_at >= $2 AND starts_at < $3
       ORDER BY starts_at`,
      [clinicianId, start, end],
    );
    const upcoming = await this.db.query(
      `SELECT id, patient_id, starts_at, ends_at, status, service_category
       FROM appointments WHERE clinician_id = $1 AND starts_at >= NOW()
       ORDER BY starts_at LIMIT 10`,
      [clinicianId],
    );
    const unread = await this.db.query(
      `SELECT t.id AS thread_id, t.subject, t.last_post_at,
              COUNT(*) FILTER (WHERE m.sender_id <> $1 AND m.read_at IS NULL) AS unread_count
       FROM message_threads t LEFT JOIN messages m ON m.thread_id = t.id
       WHERE t.clinician_id = $1 GROUP BY t.id ORDER BY t.last_post_at DESC NULLS LAST LIMIT 10`,
      [clinicianId],
    );
    const alerts = await this.db.query(
      `SELECT id, patient_id, rule_id, severity, message, created_at
       FROM cds_alerts WHERE (clinician_id = $1 OR clinician_id IS NULL) AND resolved_at IS NULL
       ORDER BY severity DESC, created_at DESC LIMIT 20`,
      [clinicianId],
    );
    const openInvoices = await this.db.query(
      `SELECT id, patient_id, total_cents, amount_paid_cents, status, currency
       FROM invoices WHERE clinician_id = $1 AND status IN ('open', 'partial')
       ORDER BY created_at DESC LIMIT 10`,
      [clinicianId],
    );
    return {
      clinicianId,
      today: caseload.rows,
      upcoming: upcoming.rows,
      unreadThreads: unread.rows,
      alerts: alerts.rows,
      openInvoices: openInvoices.rows.map((r) => ({
        id: r.id, patientId: r.patient_id,
        totalCents: Number(r.total_cents), amountPaidCents: Number(r.amount_paid_cents),
        status: r.status, currency: r.currency,
      })),
      tag: TAG,
    };
  }

  // ---------- Availability ----------

  async listAvailability(clinicianId: string) {
    const r = await this.db.query('SELECT * FROM clinician_availability WHERE clinician_id = $1 ORDER BY block_type, weekday_mask, starts_at', [clinicianId]);
    return { items: r.rows.map((row) => this.publicAvailability(row)), count: r.rows.length, tag: TAG };
  }

  async createAvailability(dto: CreateAvailabilityDto, actorId?: string) {
    const id = randomUUID();
    if (dto.blockType === 'recurring' && (!dto.weekdayMask || !dto.startTime || !dto.endTime)) {
      throw new BadRequestException('recurring blocks require weekdayMask, startTime, endTime');
    }
    if (dto.blockType === 'one_off' && (!dto.startsAt || !dto.endsAt)) {
      throw new BadRequestException('one_off blocks require startsAt, endsAt');
    }
    await this.db.query(
      `INSERT INTO clinician_availability (id, clinician_id, block_type, weekday_mask, start_time, end_time, starts_at, ends_at, kind, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, dto.clinicianId, dto.blockType, dto.weekdayMask ?? null, dto.startTime ?? null, dto.endTime ?? null, dto.startsAt ?? null, dto.endsAt ?? null, dto.kind ?? 'available', dto.notes ?? null],
    );
    await this.audit.append(actorId, 'availability', id, 'availability.created', { blockType: dto.blockType, kind: dto.kind ?? 'available' });
    const r = await this.db.query('SELECT * FROM clinician_availability WHERE id = $1', [id]);
    return { availability: this.publicAvailability(r.rows[0]), tag: TAG };
  }

  async deleteAvailability(id: string, actorId?: string) {
    const r = await this.db.query('DELETE FROM clinician_availability WHERE id = $1 RETURNING id', [id]);
    if (!r.rows[0]) throw new NotFoundException('Availability block not found');
    await this.audit.append(actorId, 'availability', id, 'availability.deleted', {});
    return { ok: true, tag: TAG };
  }

  // ---------- Treatment plans ----------

  async listTreatmentPlans(patientId: string) {
    const plans = await this.db.query('SELECT * FROM treatment_plans WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]);
    const ids = plans.rows.map((p) => p.id);
    let goalsByPlan = new Map<string, any[]>();
    if (ids.length) {
      const goals = await this.db.query(`SELECT * FROM treatment_plan_goals WHERE plan_id = ANY($1::uuid[]) ORDER BY position, created_at`, [ids]);
      for (const g of goals.rows) {
        const list = goalsByPlan.get(g.plan_id) ?? [];
        list.push({ id: g.id, description: g.description, targetDate: g.target_date, status: g.status, position: g.position });
        goalsByPlan.set(g.plan_id, list);
      }
    }
    return {
      items: plans.rows.map((p) => ({ ...this.publicPlan(p), goals: goalsByPlan.get(p.id) ?? [] })),
      count: plans.rows.length,
      tag: TAG,
    };
  }

  async createTreatmentPlan(dto: CreateTreatmentPlanDto, actorId?: string) {
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO treatment_plans (id, patient_id, clinician_id, title, diagnosis, start_date, end_date, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, dto.patientId, dto.clinicianId, dto.title, dto.diagnosis ?? null, dto.startDate ?? null, dto.endDate ?? null, dto.status ?? 'active', dto.notes ?? null],
    );
    let pos = 0;
    for (const g of dto.goals ?? []) {
      await this.db.query(
        `INSERT INTO treatment_plan_goals (id, plan_id, description, target_date, status, position)
         VALUES (gen_random_uuid(),$1,$2,$3,$4,$5)`,
        [id, g.description, g.targetDate ?? null, g.status ?? 'in_progress', g.position ?? pos++],
      );
    }
    await this.audit.append(actorId, 'treatment_plan', id, 'treatment_plan.created', { goals: dto.goals?.length ?? 0 });
    return { plan: id, tag: TAG };
  }

  async updateTreatmentPlan(id: string, dto: UpdateTreatmentPlanDto, actorId?: string) {
    const cur = await this.db.query('SELECT * FROM treatment_plans WHERE id = $1', [id]);
    if (!cur.rows[0]) throw new NotFoundException('Plan not found');
    const next = { ...cur.rows[0], ...this.mapPlanUpdate(dto) };
    await this.db.query(
      `UPDATE treatment_plans SET title = $2, diagnosis = $3, start_date = $4, end_date = $5, status = $6, notes = $7, updated_at = NOW() WHERE id = $1`,
      [id, next.title, next.diagnosis, next.start_date, next.end_date, next.status, next.notes],
    );
    if (dto.goals) {
      await this.db.query('DELETE FROM treatment_plan_goals WHERE plan_id = $1', [id]);
      let pos = 0;
      for (const g of dto.goals) {
        await this.db.query(
          `INSERT INTO treatment_plan_goals (id, plan_id, description, target_date, status, position)
           VALUES (gen_random_uuid(),$1,$2,$3,$4,$5)`,
          [id, g.description, g.targetDate ?? null, g.status ?? 'in_progress', g.position ?? pos++],
        );
      }
    }
    await this.audit.append(actorId, 'treatment_plan', id, 'treatment_plan.updated', { fields: Object.keys(dto) });
    return { ok: true, tag: TAG };
  }

  // ---------- Messaging ----------

  async listThreads(userId: string, role?: string) {
    const sql = role === 'clinician'
      ? `SELECT t.*, COUNT(m.id) FILTER (WHERE m.sender_id <> $1 AND m.read_at IS NULL) AS unread_count
         FROM message_threads t LEFT JOIN messages m ON m.thread_id = t.id
         WHERE t.clinician_id = $1 GROUP BY t.id ORDER BY t.last_post_at DESC NULLS LAST LIMIT 100`
      : `SELECT t.*, COUNT(m.id) FILTER (WHERE m.sender_id <> $1 AND m.read_at IS NULL) AS unread_count
         FROM message_threads t LEFT JOIN messages m ON m.thread_id = t.id
         WHERE t.patient_id = $1 OR t.clinician_id = $1 GROUP BY t.id ORDER BY t.last_post_at DESC NULLS LAST LIMIT 100`;
    const r = await this.db.query(sql, [userId]);
    return { items: r.rows.map((row) => this.publicThread(row)), count: r.rows.length, tag: TAG };
  }

  async findThread(id: string, userId: string) {
    const t = await this.db.query('SELECT * FROM message_threads WHERE id = $1', [id]);
    if (!t.rows[0]) throw new NotFoundException('Thread not found');
    const m = await this.db.query('SELECT * FROM messages WHERE thread_id = $1 ORDER BY created_at', [id]);
    // Mark all messages from the OTHER party as read (idempotent).
    await this.db.query('UPDATE messages SET read_at = NOW() WHERE thread_id = $1 AND sender_id <> $2 AND read_at IS NULL', [id, userId]);
    return {
      thread: this.publicThread(t.rows[0]),
      messages: m.rows.map((row) => ({
        id: row.id, senderId: row.sender_id, body: row.body, readAt: row.read_at, createdAt: row.created_at,
      })),
      tag: TAG,
    };
  }

  async createThread(dto: CreateThreadDto, actorId?: string) {
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO message_threads (id, patient_id, clinician_id, subject, appointment_id, last_post_at)
       VALUES ($1,$2,$3,$4,$5, $6)`,
      [id, dto.patientId, dto.clinicianId, dto.subject ?? null, dto.appointmentId ?? null, dto.initialMessage ? new Date().toISOString() : null],
    );
    if (dto.initialMessage && actorId) {
      await this.db.query(
        `INSERT INTO messages (id, thread_id, sender_id, body) VALUES (gen_random_uuid(),$1,$2,$3)`,
        [id, actorId, dto.initialMessage],
      );
    }
    await this.audit.append(actorId, 'message_thread', id, 'thread.created', { patientId: dto.patientId });
    return { threadId: id, tag: TAG };
  }

  async addMessage(threadId: string, dto: CreateMessageDto, actorId?: string) {
    if (!actorId) throw new BadRequestException('actorId required');
    const t = await this.db.query('SELECT id, patient_id, clinician_id FROM message_threads WHERE id = $1', [threadId]);
    if (!t.rows[0]) throw new NotFoundException('Thread not found');
    const id = randomUUID();
    await this.db.query(`INSERT INTO messages (id, thread_id, sender_id, body) VALUES ($1,$2,$3,$4)`, [id, threadId, actorId, dto.body]);
    await this.db.query('UPDATE message_threads SET last_post_at = NOW() WHERE id = $1', [threadId]);
    await this.audit.append(actorId, 'message', id, 'message.posted', { threadId });
    return { id, tag: TAG };
  }

  // ---------- CDS rule engine ----------

  async listAlerts(patientId?: string, clinicianId?: string) {
    // Refresh deterministic rules first (idempotent — duplicates skipped).
    await this.recomputeRules(patientId, clinicianId);
    const where: string[] = ['resolved_at IS NULL'];
    const params: unknown[] = [];
    if (patientId) { params.push(patientId); where.push(`patient_id = $${params.length}`); }
    if (clinicianId) { params.push(clinicianId); where.push(`(clinician_id = $${params.length} OR clinician_id IS NULL)`); }
    const r = await this.db.query(
      `SELECT * FROM cds_alerts WHERE ${where.join(' AND ')} ORDER BY severity DESC, created_at DESC LIMIT 100`,
      params,
    );
    return { items: r.rows, count: r.rows.length, tag: TAG };
  }

  /**
   * Deterministic rule engine — idempotent. Inserts a row only if no unresolved alert
   * already exists for (rule_id, patient_id). The user can mark-resolved to dismiss.
   *  - note_unsigned_72h: any clinical_note older than 72h with signed_at IS NULL.
   *  - no_followup_14d_after_intake: patient has an intake note but no future appointment within 14d.
   *  - overdue_invoice: any open invoice with due_date < NOW().
   */
  private async recomputeRules(patientId?: string, clinicianId?: string) {
    const noteFilter: string[] = ['signed_at IS NULL', `created_at < NOW() - INTERVAL '72 hours'`];
    const noteParams: unknown[] = [];
    if (patientId) { noteParams.push(patientId); noteFilter.push(`patient_id = $${noteParams.length}`); }
    if (clinicianId) { noteParams.push(clinicianId); noteFilter.push(`clinician_id = $${noteParams.length}`); }
    const unsigned = await this.db.query(`SELECT id, patient_id, clinician_id FROM clinical_notes WHERE ${noteFilter.join(' AND ')} LIMIT 50`, noteParams);
    for (const n of unsigned.rows) {
      await this.upsertAlert(n.patient_id, n.clinician_id, 'note_unsigned_72h', 'warning', `Note ${String(n.id).slice(0, 8)} unsigned >72h`);
    }
    const intakeNoFollowup = await this.db.query(
      `SELECT n.patient_id, n.clinician_id FROM clinical_notes n
       LEFT JOIN appointments a ON a.patient_id = n.patient_id AND a.starts_at > NOW() AND a.starts_at < NOW() + INTERVAL '14 days'
       WHERE n.note_type = 'intake' AND a.id IS NULL ${patientId ? `AND n.patient_id = '${patientId.replace(/[^0-9a-f-]/gi, '')}'` : ''}
       LIMIT 50`,
    );
    for (const r of intakeNoFollowup.rows) {
      await this.upsertAlert(r.patient_id, r.clinician_id, 'no_followup_14d_after_intake', 'info', 'Intake without follow-up scheduled in 14d');
    }
    const overdue = await this.db.query(
      `SELECT i.patient_id, i.clinician_id, i.id FROM invoices i WHERE i.status IN ('open', 'partial') AND i.due_date < NOW()::date LIMIT 50`,
    );
    for (const r of overdue.rows) {
      await this.upsertAlert(r.patient_id, r.clinician_id, 'overdue_invoice', 'warning', `Invoice ${String(r.id).slice(0, 8)} overdue`);
    }
  }

  private async upsertAlert(patientId: string, clinicianId: string | null, ruleId: string, severity: 'info' | 'warning' | 'critical', message: string) {
    const exists = await this.db.query(
      'SELECT id FROM cds_alerts WHERE patient_id = $1 AND rule_id = $2 AND resolved_at IS NULL LIMIT 1',
      [patientId, ruleId],
    );
    if (exists.rows[0]) return;
    await this.db.query(
      `INSERT INTO cds_alerts (id, patient_id, clinician_id, rule_id, severity, message)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5)`,
      [patientId, clinicianId, ruleId, severity, message],
    );
  }

  async resolveAlert(id: string, actorId?: string) {
    const r = await this.db.query('UPDATE cds_alerts SET resolved_at = NOW(), resolved_by = $2 WHERE id = $1 RETURNING id', [id, actorId ?? null]);
    if (!r.rows[0]) throw new NotFoundException('Alert not found');
    await this.audit.append(actorId, 'cds_alert', id, 'cds_alert.resolved', {});
    return { ok: true, tag: TAG };
  }

  // ---------- mappers ----------

  private publicAvailability(row: any) {
    return {
      id: row.id, clinicianId: row.clinician_id, blockType: row.block_type,
      weekdayMask: row.weekday_mask, startTime: row.start_time, endTime: row.end_time,
      startsAt: row.starts_at, endsAt: row.ends_at, kind: row.kind, notes: row.notes,
    };
  }
  private publicPlan(row: any) {
    return {
      id: row.id, patientId: row.patient_id, clinicianId: row.clinician_id,
      title: row.title, diagnosis: row.diagnosis, startDate: row.start_date, endDate: row.end_date,
      status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }
  private publicThread(row: any) {
    return {
      id: row.id, patientId: row.patient_id, clinicianId: row.clinician_id,
      subject: row.subject, appointmentId: row.appointment_id,
      lastPostAt: row.last_post_at, closedAt: row.closed_at, createdAt: row.created_at,
      unreadCount: row.unread_count != null ? Number(row.unread_count) : undefined,
    };
  }
  private mapPlanUpdate(dto: UpdateTreatmentPlanDto) {
    return {
      title: dto.title, diagnosis: dto.diagnosis,
      start_date: dto.startDate, end_date: dto.endDate, status: dto.status, notes: dto.notes,
    };
  }
}
