import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { AuditService } from '../clinical-records/audit.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateClaimDto, ListClaimsQueryDto } from './dto/create-claim.dto';
import { QuoteDto } from './dto/quote.dto';
import { CreateCheckoutSessionDto } from './dto/checkout.dto';

const TAG = 'MOCKUP-PURPOSE-ONLY';

type SlidingTier = { minIncomeCents: number; maxIncomeCents: number | null; discountPct: number };

/**
 * Billing — invoices, payments, claims (RAMQ/insurer simulator), pricing.
 * Stripe is the only optional real integration: when STRIPE_SECRET_KEY is set we mint a real
 * Checkout Session; otherwise we return a mock URL pointing at the in-app simulator endpoint.
 * RAMQ has no public sandbox, so /api/billing/claims is always simulator-backed.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: any = null;
  private stripeReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {
    const key = String(process.env.STRIPE_SECRET_KEY ?? '').trim();
    if (key) {
      try {
        // Lazy-require so the module loads even if `stripe` isn't installed.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Stripe = require('stripe');
        this.stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
        this.stripeReady = true;
        this.logger.log('[billing] Stripe live mode enabled');
      } catch (err) {
        this.logger.warn(`[billing] Stripe init failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // ---------- Invoices ----------

  async createInvoice(dto: CreateInvoiceDto, actorId?: string) {
    if (!dto.items?.length) throw new BadRequestException('items required');
    const id = randomUUID();
    const subtotal = dto.items.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0);
    const tax = dto.taxCents ?? 0;
    const total = subtotal + tax;
    const status = dto.status ?? 'open';
    const currency = (dto.currency ?? 'CAD').toUpperCase();

    await this.db.query(
      `INSERT INTO invoices (id, patient_id, clinician_id, appointment_id, currency, subtotal_cents, tax_cents, total_cents, status, notes, due_date, issued_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())`,
      [id, dto.patientId, dto.clinicianId, dto.appointmentId ?? null, currency, subtotal, tax, total, status, dto.notes ?? null, dto.dueDate ?? null],
    );
    let pos = 0;
    for (const it of dto.items) {
      await this.db.query(
        `INSERT INTO invoice_items (id, invoice_id, description, service_code, quantity, unit_price_cents, total_cents, position)
         VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7)`,
        [id, it.description, it.serviceCode ?? null, it.quantity, it.unitPriceCents, it.quantity * it.unitPriceCents, pos++],
      );
    }
    await this.audit.append(actorId, 'invoice', id, 'invoice.created', { total, currency, items: dto.items.length });
    return { invoice: await this.findOne(id), tag: TAG };
  }

  async listInvoices(q: ListInvoicesQueryDto) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (q.patientId) { params.push(q.patientId); where.push(`patient_id = $${params.length}`); }
    if (q.clinicianId) { params.push(q.clinicianId); where.push(`clinician_id = $${params.length}`); }
    if (q.status) { params.push(q.status); where.push(`status = $${params.length}`); }
    const sql = `SELECT * FROM invoices ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 200`;
    const r = await this.db.query(sql, params);
    return { items: r.rows.map((row) => this.publicInvoice(row)), count: r.rows.length, tag: TAG };
  }

  async findOne(id: string) {
    const r = await this.db.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (!r.rows[0]) throw new NotFoundException('Invoice not found');
    const items = await this.db.query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY position', [id]);
    const payments = await this.db.query('SELECT * FROM payments WHERE invoice_id = $1 ORDER BY received_at DESC', [id]);
    return {
      ...this.publicInvoice(r.rows[0]),
      items: items.rows.map((i) => ({
        id: i.id, description: i.description, serviceCode: i.service_code,
        quantity: i.quantity, unitPriceCents: Number(i.unit_price_cents), totalCents: Number(i.total_cents),
      })),
      payments: payments.rows.map((p) => ({
        id: p.id, method: p.method, amountCents: Number(p.amount_cents),
        currency: p.currency, status: p.status, externalId: p.external_id,
        notes: p.notes, receivedAt: p.received_at,
      })),
    };
  }

  async addPayment(invoiceId: string, dto: CreatePaymentDto, actorId?: string) {
    const inv = await this.db.query('SELECT total_cents, amount_paid_cents FROM invoices WHERE id = $1', [invoiceId]);
    if (!inv.rows[0]) throw new NotFoundException('Invoice not found');
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO payments (id, invoice_id, method, amount_cents, external_id, status, notes)
       VALUES ($1,$2,$3,$4,$5,'succeeded',$6)`,
      [id, invoiceId, dto.method ?? 'manual', dto.amountCents, dto.externalId ?? null, dto.notes ?? null],
    );
    await this.recomputeInvoiceStatus(invoiceId);
    await this.audit.append(actorId, 'invoice', invoiceId, 'invoice.payment_added', { amount: dto.amountCents, method: dto.method ?? 'manual' });
    return { payment: { id, amountCents: dto.amountCents }, invoice: await this.findOne(invoiceId), tag: TAG };
  }

  /** Internal: recomputes amount_paid_cents and the derived status from `payments`. */
  async recomputeInvoiceStatus(invoiceId: string) {
    const sums = await this.db.query(
      `SELECT COALESCE(SUM(amount_cents),0)::bigint AS paid FROM payments WHERE invoice_id = $1 AND status = 'succeeded'`,
      [invoiceId],
    );
    const paid = Number(sums.rows[0].paid);
    const inv = await this.db.query('SELECT total_cents, status FROM invoices WHERE id = $1', [invoiceId]);
    const total = Number(inv.rows[0].total_cents);
    let status = inv.rows[0].status;
    if (status !== 'void' && status !== 'uncollectible') {
      if (paid >= total && total > 0) status = 'paid';
      else if (paid > 0) status = 'partial';
      else status = 'open';
    }
    await this.db.query('UPDATE invoices SET amount_paid_cents = $2, status = $3, updated_at = NOW() WHERE id = $1', [invoiceId, paid, status]);
  }

  // ---------- Stripe Checkout ----------

  async createCheckoutSession(invoiceId: string, dto: CreateCheckoutSessionDto, actorId?: string) {
    const inv = await this.findOne(invoiceId);
    if (inv.status === 'paid') {
      return { mode: 'noop', url: dto.successUrl ?? '/#/app/billing', invoice: inv, notice: 'Already paid', tag: TAG };
    }
    const remaining = inv.totalCents - inv.amountPaidCents;
    if (remaining <= 0) throw new BadRequestException('Nothing to pay');

    if (this.stripeReady) {
      try {
        const session = await this.stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          customer_email: dto.customerEmail,
          line_items: [{
            price_data: {
              currency: inv.currency.toLowerCase(),
              product_data: { name: `PsyNova invoice ${invoiceId.slice(0, 8)}` },
              unit_amount: remaining,
            },
            quantity: 1,
          }],
          success_url: dto.successUrl ?? 'http://localhost:5173/#/app/billing?paid=1',
          cancel_url: dto.cancelUrl ?? 'http://localhost:5173/#/app/billing?cancel=1',
          metadata: { invoice_id: invoiceId },
        });
        await this.db.query('UPDATE invoices SET stripe_session_id = $2 WHERE id = $1', [invoiceId, session.id]);
        await this.audit.append(actorId, 'invoice', invoiceId, 'invoice.checkout_started', { mode: 'live', sessionId: session.id });
        return { mode: 'live', url: session.url, sessionId: session.id, tag: TAG };
      } catch (err) {
        this.logger.warn(`[billing.checkout] live failed, falling back to mock: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    const mockUrl = `/#/app/billing/sim-pay/${encodeURIComponent(invoiceId)}`;
    await this.audit.append(actorId, 'invoice', invoiceId, 'invoice.checkout_started', { mode: 'mock' });
    return {
      mode: 'mock',
      url: mockUrl,
      notice: 'Stripe not configured — POST /api/sim/billing/stripe-webhook with { invoiceId } to mark paid.',
      tag: TAG,
    };
  }

  /** Stripe webhook handler: marks invoice paid on `checkout.session.completed`. */
  async handleStripeWebhook(rawBody: Buffer, signatureHeader: string | undefined) {
    if (!this.stripeReady) {
      this.logger.warn('[billing.webhook] received but Stripe not configured');
      return { ok: false, mode: 'mock', tag: TAG };
    }
    const secret = String(process.env.STRIPE_WEBHOOK_SECRET ?? '').trim();
    if (!secret) {
      this.logger.warn('[billing.webhook] STRIPE_WEBHOOK_SECRET unset — skipping verification (dev only)');
    }
    let event;
    try {
      event = secret
        ? this.stripe.webhooks.constructEvent(rawBody, signatureHeader, secret)
        : JSON.parse(rawBody.toString('utf8'));
    } catch (err) {
      this.logger.error(`[billing.webhook] verification failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException('Webhook signature verification failed');
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId) {
        await this.markInvoicePaidFromStripe(invoiceId, session.id, session.payment_intent);
      }
    }
    return { ok: true, tag: TAG };
  }

  async markInvoicePaidFromStripe(invoiceId: string, sessionId: string, paymentIntentId?: string) {
    const inv = await this.db.query('SELECT total_cents, currency FROM invoices WHERE id = $1', [invoiceId]);
    if (!inv.rows[0]) return;
    await this.db.query(
      `INSERT INTO payments (id, invoice_id, method, amount_cents, currency, external_id, status, notes)
       VALUES (gen_random_uuid(), $1, 'stripe', $2, $3, $4, 'succeeded', 'Stripe Checkout completed')`,
      [invoiceId, inv.rows[0].total_cents, inv.rows[0].currency, paymentIntentId ?? sessionId],
    );
    await this.db.query(
      'UPDATE invoices SET stripe_session_id = $2, stripe_payment_intent_id = $3 WHERE id = $1',
      [invoiceId, sessionId, paymentIntentId ?? null],
    );
    await this.recomputeInvoiceStatus(invoiceId);
    await this.audit.append(undefined, 'invoice', invoiceId, 'invoice.paid', { source: 'stripe', sessionId });
  }

  /** Sim helper — mark paid as if Stripe webhook fired. */
  async simMarkPaid(invoiceId: string, actorId?: string) {
    const inv = await this.db.query('SELECT total_cents FROM invoices WHERE id = $1', [invoiceId]);
    if (!inv.rows[0]) throw new NotFoundException('Invoice not found');
    await this.db.query(
      `INSERT INTO payments (id, invoice_id, method, amount_cents, external_id, status, notes)
       VALUES (gen_random_uuid(), $1, 'simulator', $2, $3, 'succeeded', 'Simulator: marked paid')`,
      [invoiceId, inv.rows[0].total_cents, `sim_${Date.now()}`],
    );
    await this.recomputeInvoiceStatus(invoiceId);
    await this.audit.append(actorId, 'invoice', invoiceId, 'invoice.paid', { source: 'simulator' });
    return this.findOne(invoiceId);
  }

  // ---------- Receipt PDF ----------

  async receiptPdf(invoiceId: string): Promise<Buffer> {
    const inv = await this.findOne(invoiceId);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(20).text('PsyNova — Receipt', { align: 'left' });
      doc.fontSize(9).fillColor('#888').text('[MOCKUP PURPOSE ONLY — NOT A LEGAL RECEIPT]');
      doc.moveDown();
      doc.fillColor('#000').fontSize(11);
      doc.text(`Invoice ID: ${inv.id}`);
      doc.text(`Status: ${inv.status}`);
      doc.text(`Currency: ${inv.currency}`);
      doc.text(`Issued at: ${inv.issuedAt ?? inv.createdAt}`);
      doc.moveDown();
      doc.fontSize(13).text('Items', { underline: true });
      doc.fontSize(11);
      for (const it of inv.items) {
        doc.text(`  ${it.quantity}× ${it.description} — ${(it.totalCents / 100).toFixed(2)} ${inv.currency}`);
      }
      doc.moveDown();
      doc.fontSize(13).text(`Total: ${(inv.totalCents / 100).toFixed(2)} ${inv.currency}`);
      doc.text(`Paid:  ${(inv.amountPaidCents / 100).toFixed(2)} ${inv.currency}`);
      doc.text(`Due:   ${((inv.totalCents - inv.amountPaidCents) / 100).toFixed(2)} ${inv.currency}`);
      doc.end();
    });
  }

  // ---------- Claims (simulator-backed) ----------

  async createClaim(invoiceId: string, dto: CreateClaimDto, actorId?: string) {
    const inv = await this.db.query('SELECT total_cents FROM invoices WHERE id = $1', [invoiceId]);
    if (!inv.rows[0]) throw new NotFoundException('Invoice not found');
    const id = randomUUID();
    const amount = Number(inv.rows[0].total_cents);
    await this.db.query(
      `INSERT INTO claims (id, invoice_id, payer, payer_member_id, service_code, diagnosis_code, amount_cents, status, external_claim_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'submitted',$8)`,
      [id, invoiceId, dto.payer ?? 'ramq', dto.payerMemberId ?? null, dto.serviceCode, dto.diagnosisCode ?? null, amount, `sim_${id.slice(0, 8)}`],
    );
    await this.db.query(
      `INSERT INTO claim_events (id, claim_id, event_type, payload_json) VALUES (gen_random_uuid(), $1, 'submitted', $2::jsonb)`,
      [id, JSON.stringify({ payer: dto.payer ?? 'ramq', amount })],
    );
    await this.audit.append(actorId, 'claim', id, 'claim.submitted', { payer: dto.payer ?? 'ramq', amount });
    return { claim: await this.findClaim(id), notice: 'Simulator: POST /api/sim/billing/ramq-adjudicate to flip status.', tag: TAG };
  }

  async listClaims(q: ListClaimsQueryDto) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (q.patientId) { params.push(q.patientId); where.push(`i.patient_id = $${params.length}`); }
    if (q.status) { params.push(q.status); where.push(`c.status = $${params.length}`); }
    const sql = `SELECT c.* FROM claims c JOIN invoices i ON i.id = c.invoice_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY c.created_at DESC LIMIT 200`;
    const r = await this.db.query(sql, params);
    return { items: r.rows.map((row) => this.publicClaim(row)), count: r.rows.length, tag: TAG };
  }

  async findClaim(id: string) {
    const r = await this.db.query('SELECT * FROM claims WHERE id = $1', [id]);
    if (!r.rows[0]) throw new NotFoundException('Claim not found');
    const events = await this.db.query('SELECT * FROM claim_events WHERE claim_id = $1 ORDER BY created_at', [id]);
    return { ...this.publicClaim(r.rows[0]), events: events.rows };
  }

  /** Sim helper — flip a claim's status. */
  async simAdjudicateClaim(claimId: string, outcome: 'accepted' | 'rejected' | 'paid', reason?: string, actorId?: string) {
    const r = await this.db.query('SELECT * FROM claims WHERE id = $1', [claimId]);
    if (!r.rows[0]) throw new NotFoundException('Claim not found');
    const adjudicatedAt = new Date().toISOString();
    const paidAt = outcome === 'paid' ? adjudicatedAt : null;
    await this.db.query(
      `UPDATE claims SET status = $2, rejection_reason = $3, adjudicated_at = $4, paid_at = $5, updated_at = NOW() WHERE id = $1`,
      [claimId, outcome, outcome === 'rejected' ? reason ?? 'Simulator-rejected' : null, adjudicatedAt, paidAt],
    );
    await this.db.query(
      `INSERT INTO claim_events (id, claim_id, event_type, payload_json) VALUES (gen_random_uuid(), $1, $2, $3::jsonb)`,
      [claimId, `sim.${outcome}`, JSON.stringify({ reason })],
    );
    await this.audit.append(actorId, 'claim', claimId, `claim.${outcome}`, { reason });
    return this.findClaim(claimId);
  }

  // ---------- Pricing / quote ----------

  async quote(dto: QuoteDto) {
    const r = await this.db.query('SELECT * FROM pricing_rules WHERE service_code = $1 AND active = TRUE', [dto.serviceCode]);
    if (!r.rows[0]) throw new NotFoundException('Pricing rule not found');
    const base = Number(r.rows[0].base_price_cents);
    const tiers = r.rows[0].sliding_scale as SlidingTier[];
    let discountPct = 0;
    if (dto.annualIncomeCents != null) {
      for (const t of tiers) {
        const min = t.minIncomeCents ?? 0;
        const max = t.maxIncomeCents ?? Number.MAX_SAFE_INTEGER;
        if (dto.annualIncomeCents >= min && dto.annualIncomeCents < max) { discountPct = t.discountPct; break; }
      }
    }
    const finalCents = Math.round(base * (1 - discountPct / 100));
    return {
      serviceCode: dto.serviceCode,
      basePriceCents: base,
      discountPct,
      finalCents,
      currency: 'CAD',
      tag: TAG,
    };
  }

  // ---------- mappers ----------

  private publicInvoice(row: any) {
    return {
      id: row.id,
      patientId: row.patient_id,
      clinicianId: row.clinician_id,
      appointmentId: row.appointment_id,
      currency: row.currency,
      subtotalCents: Number(row.subtotal_cents),
      taxCents: Number(row.tax_cents),
      totalCents: Number(row.total_cents),
      amountPaidCents: Number(row.amount_paid_cents),
      status: row.status,
      stripeSessionId: row.stripe_session_id,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      notes: row.notes,
      dueDate: row.due_date,
      issuedAt: row.issued_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private publicClaim(row: any) {
    return {
      id: row.id,
      invoiceId: row.invoice_id,
      payer: row.payer,
      payerMemberId: row.payer_member_id,
      serviceCode: row.service_code,
      diagnosisCode: row.diagnosis_code,
      amountCents: Number(row.amount_cents),
      status: row.status,
      rejectionReason: row.rejection_reason,
      externalClaimId: row.external_claim_id,
      submittedAt: row.submitted_at,
      adjudicatedAt: row.adjudicated_at,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
