import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CreateBackupVideoSessionDto } from './dto/create-backup-video.dto';
import { CreatePhoneFallbackDto } from './dto/create-phone-fallback.dto';

/**
 * Backup video provider key.
 * Zoom is the primary live provider but is also exposed here so the same
 * `/api/sessions/backup-video` endpoint can mint Zoom URLs (free dev app).
 */
export type BackupProvider = 'zoom' | 'daily' | 'whereby' | 'jitsi';

export type PhoneProvider = 'twilio' | 'telnyx' | 'vonage';

export type ProviderConfig = {
  configured: boolean;
  /**
   * Hint about how a session minted via this provider will be issued.
   *  - `live`   : real provider API will be called (when implemented + keys present).
   *  - `mock`   : a deterministic placeholder URL is returned. Mockup-purpose-only.
   */
  mode: 'live' | 'mock';
};

export type ProviderSummary = {
  primary: { zoom: ProviderConfig };
  backup: {
    zoom: ProviderConfig;
    daily: ProviderConfig;
    whereby: ProviderConfig;
    jitsi: ProviderConfig;
  };
  phone: {
    twilio: ProviderConfig;
    telnyx: ProviderConfig;
    vonage: ProviderConfig;
  };
  tag: string;
};

export type BackupSessionResponse = {
  sessionId: string;
  provider: BackupProvider;
  joinUrl: string;
  mode: ProviderConfig['mode'];
  /** Mockup banner: surfaces in UI when provider creds are pending. */
  notice?: string;
  tag: string;
};

export type PhoneFallbackResponse = {
  sessionId: string;
  provider: PhoneProvider;
  phoneNumber: string;
  conferenceCode: string;
  mode: ProviderConfig['mode'];
  notice?: string;
  tag: string;
};

const PUBLIC_TAG = 'MOCKUP-PURPOSE-ONLY';
const DEFAULT_BACKUP_PHONE = '+1-555-0100';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  /** Public-safe summary of provider readiness. Reads BACKEND env only (never `VITE_*`). */
  getProviders(): ProviderSummary {
    const zoomConfigured = this.hasAll([
      process.env.ZOOM_CLIENT_ID,
      process.env.ZOOM_CLIENT_SECRET,
      process.env.ZOOM_ACCOUNT_ID,
    ]);
    const dailyConfigured = this.hasAll([process.env.DAILY_API_KEY]);
    const wherebyConfigured = this.hasAll([process.env.WHEREBY_API_KEY]);
    const jitsiPublicAllowed = process.env.JITSI_PUBLIC_DEMO_ROOM === 'true';
    const twilioConfigured = this.hasAll([
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
      process.env.TWILIO_PHONE_NUMBER,
    ]);
    const telnyxConfigured = this.hasAll([process.env.TELNYX_API_KEY]);
    const vonageConfigured = this.hasAll([process.env.VONAGE_API_KEY, process.env.VONAGE_API_SECRET]);

    const zoomCfg: ProviderConfig = { configured: zoomConfigured, mode: zoomConfigured ? 'live' : 'mock' };
    return {
      primary: { zoom: zoomCfg },
      backup: {
        zoom: zoomCfg,
        daily: { configured: dailyConfigured, mode: dailyConfigured ? 'live' : 'mock' },
        whereby: { configured: wherebyConfigured, mode: wherebyConfigured ? 'live' : 'mock' },
        // Jitsi has no API; "configured" === public meet.jit.si rooms allowed.
        jitsi: { configured: jitsiPublicAllowed, mode: jitsiPublicAllowed ? 'live' : 'mock' },
      },
      phone: {
        twilio: { configured: twilioConfigured, mode: twilioConfigured ? 'live' : 'mock' },
        telnyx: { configured: telnyxConfigured, mode: telnyxConfigured ? 'live' : 'mock' },
        vonage: { configured: vonageConfigured, mode: vonageConfigured ? 'live' : 'mock' },
      },
      tag: PUBLIC_TAG,
    };
  }

  /**
   * Mint a backup video join URL.
   * Auto-pick order when `payload.provider` is omitted: zoom -> daily -> whereby -> jitsi.
   * Each provider falls back to a deterministic mock URL when its credentials are missing.
   */
  async createBackupVideoSession(payload: CreateBackupVideoSessionDto): Promise<BackupSessionResponse> {
    const summary = this.getProviders();
    const provider = payload.provider ?? this.pickBestBackup(summary);
    this.logger.log(
      `[sessions.createBackupVideoSession] sessionId=${payload.sessionId} provider=${provider}`,
    );

    if (provider === 'zoom') {
      return summary.backup.zoom.configured
        ? this.mintZoomLive(payload.sessionId)
        : this.mintMock('zoom', payload.sessionId);
    }
    if (provider === 'daily') {
      return summary.backup.daily.configured
        ? this.mintDailyLive(payload.sessionId)
        : this.mintMock('daily', payload.sessionId);
    }
    if (provider === 'whereby') {
      return summary.backup.whereby.configured
        ? this.mintWherebyLive(payload.sessionId)
        : this.mintMock('whereby', payload.sessionId);
    }
    return summary.backup.jitsi.configured
      ? this.mintJitsiPublicRoom(payload.sessionId)
      : this.mintMock('jitsi', payload.sessionId);
  }

  /**
   * Mint a phone fallback (PSTN) instruction.
   * Auto-pick order when `payload.provider` is omitted: twilio -> telnyx -> vonage.
   * Mock returns BACKUP_PHONE_NUMBER + a deterministic 6-digit conference code so the demo flow
   * always renders a usable callback number, even with zero credentials configured.
   */
  async createPhoneFallback(payload: CreatePhoneFallbackDto): Promise<PhoneFallbackResponse> {
    const summary = this.getProviders();
    const provider = payload.provider ?? this.pickBestPhone(summary);
    this.logger.log(
      `[sessions.createPhoneFallback] sessionId=${payload.sessionId} provider=${provider} to=${payload.toNumber ?? 'unset'}`,
    );

    if (provider === 'twilio' && summary.phone.twilio.configured) {
      return this.mintTwilioLive(payload);
    }
    if (provider === 'telnyx' && summary.phone.telnyx.configured) {
      return this.mintTelnyxLive(payload);
    }
    if (provider === 'vonage' && summary.phone.vonage.configured) {
      return this.mintVonageLive(payload);
    }
    return this.mintPhoneMock(provider, payload.sessionId);
  }

  // ---------- private ----------

  private hasAll(values: Array<string | undefined>): boolean {
    return values.every((v) => !!String(v ?? '').trim());
  }

  /** Stable preference order when caller doesn't specify. */
  private pickBestBackup(summary: ProviderSummary): BackupProvider {
    if (summary.backup.zoom.configured) return 'zoom';
    if (summary.backup.daily.configured) return 'daily';
    if (summary.backup.whereby.configured) return 'whereby';
    if (summary.backup.jitsi.configured) return 'jitsi';
    // Jitsi public rooms work without keys when allowed; otherwise fall through to mock 'zoom'.
    return 'jitsi';
  }

  private pickBestPhone(summary: ProviderSummary): PhoneProvider {
    if (summary.phone.twilio.configured) return 'twilio';
    if (summary.phone.telnyx.configured) return 'telnyx';
    if (summary.phone.vonage.configured) return 'vonage';
    return 'twilio';
  }

  private mintMock(provider: BackupProvider, sessionId: string): BackupSessionResponse {
    // For Zoom mock we use a real-looking zoom.us URL so the click-through smoke test is
    // visually meaningful (the link 404s harmlessly).
    const joinUrl =
      provider === 'zoom'
        ? `https://zoom.us/j/${this.deterministicZoomMeetingId(sessionId)}`
        : `https://example.invalid/demo/${provider}/${encodeURIComponent(sessionId)}`;
    return {
      sessionId,
      provider,
      joinUrl,
      mode: 'mock',
      notice: 'Demo mode: provider credentials pending.',
      tag: PUBLIC_TAG,
    };
  }

  /** Free public Jitsi room. No API key required. Safe for demos only. */
  private mintJitsiPublicRoom(sessionId: string): BackupSessionResponse {
    return {
      sessionId,
      provider: 'jitsi',
      joinUrl: `https://meet.jit.si/psynova-${encodeURIComponent(sessionId)}`,
      mode: 'live',
      tag: PUBLIC_TAG,
    };
  }

  /**
   * Live Zoom mint via Server-to-Server OAuth (free dev app).
   * Steps:
   *   1) POST https://zoom.us/oauth/token?grant_type=account_credentials&account_id=...
   *      with HTTP Basic Auth (client_id:client_secret) → access_token.
   *   2) POST https://api.zoom.us/v2/users/me/meetings with the access_token →
   *      response.join_url.
   * Any failure (network, 4xx, missing token) falls back to mintMock so the UI never
   * hard-breaks during a demo with broken creds.
   */
  private async mintZoomLive(sessionId: string): Promise<BackupSessionResponse> {
    try {
      const accountId = String(process.env.ZOOM_ACCOUNT_ID ?? '').trim();
      const clientId = String(process.env.ZOOM_CLIENT_ID ?? '').trim();
      const clientSecret = String(process.env.ZOOM_CLIENT_SECRET ?? '').trim();
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const tokenRes = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
        { method: 'POST', headers: { Authorization: `Basic ${basic}` } },
      );
      if (!tokenRes.ok) {
        throw new Error(`zoom token http ${tokenRes.status}`);
      }
      const tokenJson = (await tokenRes.json()) as { access_token?: string };
      const accessToken = tokenJson.access_token;
      if (!accessToken) {
        throw new Error('zoom token missing access_token');
      }

      const meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: `PsyNova session ${sessionId}`,
          type: 2,
          settings: { join_before_host: true, waiting_room: false },
        }),
      });
      if (!meetingRes.ok) {
        throw new Error(`zoom meeting http ${meetingRes.status}`);
      }
      const meeting = (await meetingRes.json()) as { join_url?: string };
      if (!meeting.join_url) {
        throw new Error('zoom meeting missing join_url');
      }
      return {
        sessionId,
        provider: 'zoom',
        joinUrl: meeting.join_url,
        mode: 'live',
        notice: 'Zoom dev app meeting',
        tag: PUBLIC_TAG,
      };
    } catch (err) {
      this.logger.warn(
        `[sessions.mintZoomLive] live call failed, falling back to mock: ${err instanceof Error ? err.message : String(err)}`,
      );
      return {
        ...this.mintMock('zoom', sessionId),
        notice: 'Zoom live call failed; using mock URL.',
      };
    }
  }

  /**
   * STUB — real implementation would POST to https://api.daily.co/v1/rooms
   * with `Authorization: Bearer ${DAILY_API_KEY}` and return `data.url`.
   * Intentionally not implemented here: backend stub seam only.
   */
  private async mintDailyLive(sessionId: string): Promise<BackupSessionResponse> {
    this.logger.warn(
      `[sessions.mintDailyLive] STUB — DAILY_API_KEY present but live provider integration not implemented; returning mock URL`,
    );
    return { ...this.mintMock('daily', sessionId), notice: 'Live provider stub — real integration pending.' };
  }

  /**
   * STUB — real implementation would POST to https://api.whereby.dev/v1/meetings
   * with `Authorization: Bearer ${WHEREBY_API_KEY}` and return `roomUrl`.
   * Intentionally not implemented here: backend stub seam only.
   */
  private async mintWherebyLive(sessionId: string): Promise<BackupSessionResponse> {
    this.logger.warn(
      `[sessions.mintWherebyLive] STUB — WHEREBY_API_KEY present but live provider integration not implemented; returning mock URL`,
    );
    return {
      ...this.mintMock('whereby', sessionId),
      notice: 'Live provider stub — real integration pending.',
    };
  }

  /**
   * Live Twilio mint (free trial — outbound calls free to verified numbers).
   * Issues a programmable voice call via the Calls REST API. The TwiML at TWILIO_TWIML_URL
   * (or the default <Response><Say>...</Say></Response> echo URL) is what the callee hears.
   * Falls back to mintPhoneMock on any error so the demo flow stays usable.
   */
  private async mintTwilioLive(payload: CreatePhoneFallbackDto): Promise<PhoneFallbackResponse> {
    try {
      const sid = String(process.env.TWILIO_ACCOUNT_SID ?? '').trim();
      const token = String(process.env.TWILIO_AUTH_TOKEN ?? '').trim();
      const from = String(process.env.TWILIO_PHONE_NUMBER ?? '').trim();
      const twiml = String(process.env.TWILIO_TWIML_URL ?? '').trim() ||
        'http://demo.twilio.com/docs/voice.xml';
      const to = (payload.toNumber ?? '').trim();
      if (!to) {
        // Without a destination number we can't place a real call; surface a mock with
        // the agent's own From number so the UI still shows something usable.
        return {
          ...this.mintPhoneMock('twilio', payload.sessionId),
          phoneNumber: from || DEFAULT_BACKUP_PHONE,
          notice: 'Twilio configured but no toNumber provided; mock returned.',
        };
      }
      const body = new URLSearchParams({ From: from, To: to, Url: twiml });
      const basic = Buffer.from(`${sid}:${token}`).toString('base64');
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Calls.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        },
      );
      if (!res.ok) {
        throw new Error(`twilio http ${res.status}`);
      }
      const callJson = (await res.json()) as { sid?: string };
      return {
        sessionId: payload.sessionId,
        provider: 'twilio',
        phoneNumber: from,
        conferenceCode: this.deterministicConferenceCode(payload.sessionId),
        mode: 'live',
        notice: `Twilio call queued (sid=${callJson.sid ?? 'unknown'}).`,
        tag: PUBLIC_TAG,
      };
    } catch (err) {
      this.logger.warn(
        `[sessions.mintTwilioLive] live call failed, falling back to mock: ${err instanceof Error ? err.message : String(err)}`,
      );
      return {
        ...this.mintPhoneMock('twilio', payload.sessionId),
        notice: 'Twilio live call failed; using mock fallback.',
      };
    }
  }

  /** STUB — Telnyx wired but not activated. Returns mock until real REST integration ships. */
  private async mintTelnyxLive(payload: CreatePhoneFallbackDto): Promise<PhoneFallbackResponse> {
    this.logger.warn(
      '[sessions.mintTelnyxLive] STUB — TELNYX_API_KEY present but live provider integration not implemented; returning mock',
    );
    return {
      ...this.mintPhoneMock('telnyx', payload.sessionId),
      notice: 'Telnyx live stub — paid integration pending.',
    };
  }

  /** STUB — Vonage wired but not activated. Returns mock until real REST integration ships. */
  private async mintVonageLive(payload: CreatePhoneFallbackDto): Promise<PhoneFallbackResponse> {
    this.logger.warn(
      '[sessions.mintVonageLive] STUB — VONAGE_API_KEY present but live provider integration not implemented; returning mock',
    );
    return {
      ...this.mintPhoneMock('vonage', payload.sessionId),
      notice: 'Vonage live stub — paid integration pending.',
    };
  }

  private mintPhoneMock(provider: PhoneProvider, sessionId: string): PhoneFallbackResponse {
    const phoneNumber = String(process.env.BACKUP_PHONE_NUMBER ?? '').trim() || DEFAULT_BACKUP_PHONE;
    return {
      sessionId,
      provider,
      phoneNumber,
      conferenceCode: this.deterministicConferenceCode(sessionId),
      mode: 'mock',
      notice: 'Demo mode: dial this number and enter the conference code.',
      tag: PUBLIC_TAG,
    };
  }

  private deterministicConferenceCode(sessionId: string): string {
    // 6-digit code derived from sessionId so repeated calls return the same code.
    const digest = createHash('sha256').update(sessionId).digest();
    const n = digest.readUInt32BE(0) % 1_000_000;
    return n.toString().padStart(6, '0');
  }

  private deterministicZoomMeetingId(sessionId: string): string {
    // 10-digit Zoom-style numeric meeting id derived from sessionId for the mock URL.
    const digest = createHash('sha256').update(sessionId).digest();
    const n =
      (digest.readUInt32BE(0) >>> 0) * 0x100000000 + (digest.readUInt32BE(4) >>> 0);
    return (n % 9_000_000_000 + 1_000_000_000).toString();
  }
}
