import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { BackupSessionResponse, SessionsService } from '../sessions/sessions.service';

/**
 * Composed payload returned by GET /api/telehealth/sessions/:id/launch.
 * Aggregates video provider URL + mock chat handle + pointer to the appointment record
 * (which carries notes) + the consent checklist the clinician must walk through.
 */
export type TelehealthLaunchResponse = {
  sessionId: string;
  video: BackupSessionResponse;
  chat: {
    mode: 'mock';
    token: string;
    channel: string;
    notice: string;
  };
  notes: { url: string };
  consentChecklist: Array<{ id: string; label: string; required: boolean }>;
  tag: string;
};

const PUBLIC_TAG = 'MOCKUP-PURPOSE-ONLY';

@Injectable()
export class TelehealthService {
  private readonly logger = new Logger(TelehealthService.name);
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Compose the unified telehealth launch payload.
   * Today: video delegates to SessionsService (auto-picks zoom -> jitsi).
   *        chat is a mock token (no real chat backend wired yet).
   *        notes points at the existing appointment record.
   * Later: chat would mint a real Stream/Twilio Conversations token; consent items would be
   *        persisted as user acknowledgements on the appointment.
   */
  async launch(sessionId: string): Promise<TelehealthLaunchResponse> {
    this.logger.log(`[telehealth.launch] sessionId=${sessionId}`);
    const video = await this.sessionsService.createBackupVideoSession({ sessionId });
    return {
      sessionId,
      video,
      chat: {
        mode: 'mock',
        token: this.deterministicChatToken(sessionId),
        channel: `tele-${sessionId}`,
        notice: 'Demo chat token — no real chat backend wired.',
      },
      notes: { url: `/api/appointments/${encodeURIComponent(sessionId)}` },
      consentChecklist: [
        { id: 'identity', label: 'Verify patient identity', required: true },
        { id: 'audio_test', label: 'Confirm working microphone and speaker', required: true },
        { id: 'consent_recording', label: 'Confirm recording consent (or no-record mode)', required: true },
      ],
      tag: PUBLIC_TAG,
    };
  }

  private deterministicChatToken(sessionId: string): string {
    return createHash('sha256').update(`tele:${sessionId}`).digest('hex').slice(0, 32);
  }
}
