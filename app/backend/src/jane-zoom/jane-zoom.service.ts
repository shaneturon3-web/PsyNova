import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { SessionsService } from '../sessions/sessions.service';
import { parseIcalEvents } from './jane-ical.parser';
import type { CreateZoomMeetingDto } from './dto/create-zoom-meeting.dto';

export type JaneAppointmentRow = {
  id: string;
  patientLabel: string;
  startAt: string;
  endAt?: string;
  zoomMeetingId?: string;
  joinUrl?: string;
  mode: 'live' | 'mock';
  notice?: string;
};

type ZoomTokenCache = { accessToken: string; expiresAt: number };

const PUBLIC_TAG = 'MOCKUP-PURPOSE-ONLY';

@Injectable()
export class JaneZoomService {
  private readonly logger = new Logger(JaneZoomService.name);
  private tokenCache: ZoomTokenCache | null = null;
  private readonly memoryAppointments = new Map<string, JaneAppointmentRow>();

  constructor(
    private readonly db: DatabaseService,
    private readonly sessions: SessionsService,
  ) {}

  /** Server-to-Server OAuth token (cached). Falls back to mock token envelope. */
  async getZoomToken(): Promise<{
    accessToken: string;
    mode: 'live' | 'mock';
    expiresIn: number;
    tag: string;
    notice?: string;
  }> {
    const live = await this.fetchZoomAccessToken();
    if (live) {
      return {
        accessToken: live.accessToken,
        mode: 'live',
        expiresIn: Math.max(0, Math.floor((live.expiresAt - Date.now()) / 1000)),
        tag: PUBLIC_TAG,
      };
    }
    return {
      accessToken: 'mock-zoom-token',
      mode: 'mock',
      expiresIn: 3600,
      notice: 'Zoom credentials missing or token request failed; mock token returned.',
      tag: PUBLIC_TAG,
    };
  }

  /** Create meeting — live Zoom API with sessions-service fallback chain. */
  async createMeeting(dto: CreateZoomMeetingDto) {
    const sessionId = dto.appointmentId ?? this.slugFromPatient(dto.patientName, dto.startTime);
    const backup = await this.sessions.createBackupVideoSession({
      sessionId,
      provider: 'zoom',
    });
    const row: JaneAppointmentRow = {
      id: sessionId,
      patientLabel: dto.patientName,
      startAt: dto.startTime,
      joinUrl: backup.joinUrl,
      zoomMeetingId: this.extractMeetingId(backup.joinUrl),
      mode: backup.mode,
      notice: backup.notice,
    };
    await this.persistAppointment(row, sessionId);
    return {
      appointmentId: sessionId,
      meetingId: row.zoomMeetingId,
      joinUrl: row.joinUrl,
      signature: this.mockSdkSignature(sessionId),
      mode: row.mode,
      notice: row.notice,
      tag: PUBLIC_TAG,
    };
  }

  /** Parse Jane iCal/WebCal and link Zoom rooms (dual fallback: feed → mock schedule). */
  async syncJaneFeed(feedUrl?: string) {
    const url = (feedUrl ?? process.env.JANE_ICAL_URL ?? '').trim();
    let events = await this.fetchJaneEvents(url);
    let source: 'live' | 'mock' = url ? 'live' : 'mock';
    if (!events.length) {
      events = this.mockJaneEvents();
      source = 'mock';
    }

    const linked: JaneAppointmentRow[] = [];
    for (const ev of events) {
      const id = `jane-${createHash('sha256').update(ev.uid).digest('hex').slice(0, 12)}`;
      const created = await this.createMeeting({
        patientName: ev.summary,
        startTime: ev.startAt,
        appointmentId: id,
      });
      linked.push({
        id,
        patientLabel: ev.summary,
        startAt: ev.startAt,
        endAt: ev.endAt,
        joinUrl: created.joinUrl,
        zoomMeetingId: created.meetingId,
        mode: created.mode,
        notice: created.notice,
      });
    }
    return {
      imported: linked.length,
      source,
      appointments: linked,
      tag: PUBLIC_TAG,
    };
  }

  getTodaySchedule(): { date: string; appointments: JaneAppointmentRow[]; tag: string } {
    const today = new Date().toISOString().slice(0, 10);
    const appointments = [...this.memoryAppointments.values()]
      .filter((a) => a.startAt.startsWith(today))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
    return { date: today, appointments, tag: PUBLIC_TAG };
  }

  getAppointment(id: string): JaneAppointmentRow | undefined {
    return this.memoryAppointments.get(id);
  }

  // ---------- private ----------

  private async fetchJaneEvents(url: string) {
    if (!url) return [];
    try {
      const res = await fetch(url, { headers: { Accept: 'text/calendar' } });
      if (!res.ok) throw new Error(`jane feed http ${res.status}`);
      const text = await res.text();
      return parseIcalEvents(text);
    } catch (err) {
      this.logger.warn(
        `[jane.sync] feed failed, will use mock: ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
  }

  private mockJaneEvents() {
    const base = new Date();
    base.setHours(9, 0, 0, 0);
    return [
      {
        uid: 'mock-1',
        summary: 'Patient A.M.',
        startAt: new Date(base.getTime()).toISOString(),
        endAt: new Date(base.getTime() + 50 * 60_000).toISOString(),
      },
      {
        uid: 'mock-2',
        summary: 'Patient B.K.',
        startAt: new Date(base.getTime() + 2 * 60 * 60_000).toISOString(),
        endAt: new Date(base.getTime() + 2 * 60 * 60_000 + 50 * 60_000).toISOString(),
      },
    ];
  }

  private async fetchZoomAccessToken(): Promise<ZoomTokenCache | null> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60_000) {
      return this.tokenCache;
    }
    const accountId = String(process.env.ZOOM_ACCOUNT_ID ?? '').trim();
    const clientId = String(process.env.ZOOM_CLIENT_ID ?? '').trim();
    const clientSecret = String(process.env.ZOOM_CLIENT_SECRET ?? '').trim();
    if (!accountId || !clientId || !clientSecret) return null;

    try {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const res = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
        { method: 'POST', headers: { Authorization: `Basic ${basic}` } },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { access_token?: string; expires_in?: number };
      if (!json.access_token) return null;
      const expiresIn = Number(json.expires_in ?? 3600);
      this.tokenCache = {
        accessToken: json.access_token,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      return this.tokenCache;
    } catch {
      return null;
    }
  }

  private mockSdkSignature(sessionId: string): string {
    return createHash('sha256').update(`mock-signature:${sessionId}`).digest('base64url');
  }

  private slugFromPatient(name: string, start: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
    return `jane-${slug}-${start.slice(0, 10)}`;
  }

  private extractMeetingId(joinUrl?: string): string | undefined {
    if (!joinUrl) return undefined;
    const m = joinUrl.match(/\/j\/(\d+)/);
    return m?.[1];
  }

  private async persistAppointment(row: JaneAppointmentRow, externalUid?: string) {
    this.memoryAppointments.set(row.id, row);
    if (!this.db.isEnabled()) return;
    try {
      await this.db.query(
        `INSERT INTO jane_appointments (id, external_uid, patient_label, starts_at, ends_at, zoom_meeting_id, join_url, provider_mode, synced_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
         ON CONFLICT (id) DO UPDATE SET
           patient_label = EXCLUDED.patient_label,
           join_url = EXCLUDED.join_url,
           zoom_meeting_id = EXCLUDED.zoom_meeting_id,
           provider_mode = EXCLUDED.provider_mode,
           updated_at = NOW()`,
        [
          row.id,
          externalUid ?? row.id,
          row.patientLabel,
          row.startAt,
          row.endAt ?? null,
          row.zoomMeetingId ?? null,
          row.joinUrl ?? null,
          row.mode,
        ],
      );
    } catch (err) {
      this.logger.warn(
        `[jane.persist] db skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
