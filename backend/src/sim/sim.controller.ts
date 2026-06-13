import { BadRequestException, Body, Controller, Get, Logger, NotFoundException, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { DatabaseService } from '../database/database.service';
import { BillingService } from '../billing/billing.service';

const TAG = 'MOCKUP-PURPOSE-ONLY';

type ReqUser = Request & { authUser?: { sub?: string } };

/**
 * Dev/test simulator. Lets QA flip backend state without leaving the box: pretend Stripe
 * called the webhook, pretend RAMQ adjudicated a claim, drop a sample attachment for a
 * patient, attempt a forbidden audit_events UPDATE (and watch the trigger reject it).
 *
 * EVERY endpoint returns 404 in `production`. The whole module is also a clear marker for
 * grep so it can be removed wholesale at productionisation time.
 */
@Controller('sim')
export class SimController {
  private readonly logger = new Logger(SimController.name);
  constructor(private readonly db: DatabaseService, private readonly billing: BillingService) {}

  private guardProd() {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
  }

  @Get('status')
  async status() {
    this.guardProd();
    const tables = ['invoices', 'claims', 'clinical_notes', 'consents', 'attachments', 'audit_events', 'message_threads', 'cds_alerts', 'treatment_plans', 'clinician_availability'];
    const out: Record<string, number> = {};
    for (const t of tables) {
      try {
        const r = await this.db.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
        out[t] = r.rows[0].n as number;
      } catch {
        out[t] = -1;
      }
    }
    return {
      mode: 'simulator',
      env: process.env.NODE_ENV ?? 'unknown',
      stripe: !!String(process.env.STRIPE_SECRET_KEY ?? '').trim(),
      counts: out,
      hint: 'POST /api/sim/billing/stripe-webhook { invoiceId } | /api/sim/billing/ramq-adjudicate { claimId, outcome } | /api/sim/clinical/audit-tamper-attempt | /api/sim/clinical/upload-mock-attachment { patientId } | /api/sim/workspace/seed-caseload { clinicianId, patientId }',
      tag: TAG,
    };
  }

  @Post('billing/stripe-webhook')
  async stripeWebhook(@Body() body: { invoiceId: string }, @Req() req: ReqUser) {
    this.guardProd();
    if (!body?.invoiceId) throw new BadRequestException('invoiceId required');
    const invoice = await this.billing.simMarkPaid(body.invoiceId, req.authUser?.sub);
    return { ok: true, invoice, tag: TAG };
  }

  @Post('billing/ramq-adjudicate')
  async ramqAdjudicate(@Body() body: { claimId: string; outcome: 'accepted' | 'rejected' | 'paid'; reason?: string }, @Req() req: ReqUser) {
    this.guardProd();
    if (!body?.claimId || !body?.outcome) throw new BadRequestException('claimId + outcome required');
    if (!['accepted', 'rejected', 'paid'].includes(body.outcome)) throw new BadRequestException('invalid outcome');
    const claim = await this.billing.simAdjudicateClaim(body.claimId, body.outcome, body.reason, req.authUser?.sub);
    return { ok: true, claim, tag: TAG };
  }

  @Post('clinical/audit-tamper-attempt')
  async auditTamper() {
    this.guardProd();
    const r = await this.db.query('SELECT id FROM audit_events ORDER BY created_at DESC LIMIT 1');
    if (!r.rows[0]) {
      return { ok: true, attempted: false, message: 'No audit events to tamper with yet — make any write first.', tag: TAG };
    }
    try {
      // The trigger raises an exception on any UPDATE; we catch it to demonstrate the protection.
      await this.db.query(`UPDATE audit_events SET payload_json = '{"tampered": true}'::jsonb WHERE id = $1`, [r.rows[0].id]);
      return { ok: false, attempted: true, message: 'UPDATE unexpectedly succeeded — trigger missing!', tag: TAG };
    } catch (err) {
      return {
        ok: true,
        attempted: true,
        rejectedBy: 'audit_events_no_update trigger',
        message: err instanceof Error ? err.message : String(err),
        verify: '/api/clinical/audit/verify',
        tag: TAG,
      };
    }
  }

  @Post('clinical/upload-mock-attachment')
  async uploadMockAttachment(@Body() body: { patientId: string }, @Req() req: ReqUser) {
    this.guardProd();
    if (!body?.patientId) throw new BadRequestException('patientId required');
    const id = randomUUID();
    const dir = String(process.env.ATTACHMENTS_DIR ?? path.resolve(process.cwd(), '..', 'uploads', 'clinical')).trim();
    await mkdir(dir, { recursive: true });
    const filename = `sim-attachment-${id.slice(0, 8)}.txt`;
    const storagePath = path.join(dir, `${id}-${filename}`);
    const content = Buffer.from(`PsyNova mock clinical attachment\nPatient: ${body.patientId}\nGenerated: ${new Date().toISOString()}\n[MOCKUP PURPOSE ONLY]\n`);
    await writeFile(storagePath, content);
    const sha = createHash('sha256').update(content).digest('hex');
    await this.db.query(
      `INSERT INTO attachments (id, patient_id, uploader_id, filename, mime_type, byte_size, storage_path, sha256)
       VALUES ($1,$2,$3,$4,'text/plain',$5,$6,$7)`,
      [id, body.patientId, req.authUser?.sub ?? body.patientId, filename, content.length, storagePath, sha],
    );
    return { ok: true, attachment: { id, filename, byteSize: content.length, sha256: sha }, tag: TAG };
  }

  @Post('workspace/seed-caseload')
  async seedCaseload(@Body() body: { clinicianId: string; patientId: string }, @Req() req: ReqUser) {
    this.guardProd();
    if (!body?.clinicianId || !body?.patientId) throw new BadRequestException('clinicianId + patientId required');
    const _ = req.authUser?.sub;
    const created: Record<string, string[]> = { appointments: [] };
    // 2 appointments (one past, one upcoming).
    for (const offset of [-2, 3]) {
      const id = randomUUID();
      const d = new Date(); d.setDate(d.getDate() + offset);
      await this.db.query(
        `INSERT INTO appointments (id, patient_id, clinician_id, starts_at, ends_at, status, service_category, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,'individual_session', NOW())`,
        [id, body.patientId, body.clinicianId, d.toISOString(), new Date(d.getTime() + 60 * 60 * 1000).toISOString(), offset < 0 ? 'completed' : 'confirmed'],
      );
      created.appointments.push(id);
    }
    return { ok: true, created, tag: TAG };
  }
}
