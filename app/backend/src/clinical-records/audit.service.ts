import { Injectable, Logger } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import { DatabaseService } from '../database/database.service';

const TAG = 'MOCKUP-PURPOSE-ONLY';

/**
 * Append-only audit log with a sha256 hash chain.
 *
 * Every write hashes the previous row's `current_hash` together with a canonical-JSON
 * serialization of the new payload. Any tamper attempt (UPDATE/DELETE) is rejected by
 * the `audit_events_block_mutation` trigger in 09-clinical-records.sql, so demonstrating
 * tamper-evidence in the simulator is just "try to UPDATE a row" → 409.
 *
 * AUDIT_LOG_HMAC_SECRET, when set, switches `current_hash` to HMAC-SHA256 (still mixing in
 * `prev_hash`), so chain verification requires both the secret AND the prior row content.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly db: DatabaseService) {}

  async append(actorId: string | undefined, entityType: string, entityId: string | null | undefined, action: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.db.isEnabled()) return;
    try {
      const prev = await this.db.query('SELECT current_hash FROM audit_events ORDER BY created_at DESC, id DESC LIMIT 1');
      const prevHash = prev.rows[0]?.current_hash ?? '';
      // NOTE: do NOT include the timestamp in the canonical hash — Postgres assigns
      // `created_at` via DEFAULT NOW(), which differs by microseconds from any JS Date()
      // we'd compute here. The chain integrity is `prev_hash + canonical(payload)`; the
      // timestamp is metadata for sorting/display only.
      const canonical = this.canonicalJson({ entityType, entityId, action, payload });
      const secret = String(process.env.AUDIT_LOG_HMAC_SECRET ?? '').trim();
      const currentHash = secret
        ? createHmac('sha256', secret).update(prevHash + canonical).digest('hex')
        : createHash('sha256').update(prevHash + canonical).digest('hex');
      await this.db.query(
        `INSERT INTO audit_events (id, actor_id, entity_type, entity_id, action, payload_json, prev_hash, current_hash)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, $6, $7)`,
        [actorId ?? null, entityType, entityId ?? null, action, JSON.stringify(payload), prevHash || null, currentHash],
      );
    } catch (err) {
      this.logger.warn(`[audit.append] ${entityType}/${action} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async list(filters: { actorId?: string; entityId?: string; entityType?: string; from?: string; to?: string }) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filters.actorId) { params.push(filters.actorId); where.push(`actor_id = $${params.length}`); }
    if (filters.entityId) { params.push(filters.entityId); where.push(`entity_id = $${params.length}`); }
    if (filters.entityType) { params.push(filters.entityType); where.push(`entity_type = $${params.length}`); }
    if (filters.from) { params.push(filters.from); where.push(`created_at >= $${params.length}`); }
    if (filters.to) { params.push(filters.to); where.push(`created_at <= $${params.length}`); }
    const sql = `SELECT id, actor_id, entity_type, entity_id, action, payload_json, prev_hash, current_hash, created_at
                 FROM audit_events ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                 ORDER BY created_at DESC, id DESC LIMIT 500`;
    const r = await this.db.query(sql, params);
    return { items: r.rows, count: r.rows.length, tag: TAG };
  }

  /** Walk the chain in insertion order; return the first row whose recomputed hash doesn't match. */
  async verify() {
    const r = await this.db.query('SELECT id, action, entity_type, entity_id, payload_json, prev_hash, current_hash, created_at FROM audit_events ORDER BY created_at, id');
    let prevHash = '';
    const secret = String(process.env.AUDIT_LOG_HMAC_SECRET ?? '').trim();
    for (const row of r.rows) {
      const canonical = this.canonicalJson({ entityType: row.entity_type, entityId: row.entity_id, action: row.action, payload: row.payload_json });
      const expected = secret
        ? createHmac('sha256', secret).update(prevHash + canonical).digest('hex')
        : createHash('sha256').update(prevHash + canonical).digest('hex');
      if (expected !== row.current_hash || (row.prev_hash ?? '') !== prevHash) {
        return { ok: false, brokenAt: row.id, expected, actual: row.current_hash, total: r.rows.length, tag: TAG };
      }
      prevHash = row.current_hash;
    }
    return { ok: true, total: r.rows.length, tag: TAG };
  }

  private canonicalJson(obj: unknown): string {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map((v) => this.canonicalJson(v)).join(',')}]`;
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${this.canonicalJson((obj as any)[k])}`).join(',')}}`;
  }
}
