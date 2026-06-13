import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { CreateBackupVideoSessionDto } from './dto/create-backup-video.dto';
import { CreatePhoneFallbackDto } from './dto/create-phone-fallback.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);
  constructor(private readonly sessionsService: SessionsService) {}

  /** Public read-only readiness summary. No secrets leak; only configured/mode booleans. */
  @Get('providers')
  getProviders() {
    return this.sessionsService.getProviders();
  }

  /**
   * Mint a backup video join URL. No auth required for the mockup; once real provider
   * integration lands, this endpoint should be guarded by `AuthTokenGuard` and scope-checked
   * against the appointment / participant.
   */
  @Post('backup-video')
  createBackupVideoSession(@Body() body: CreateBackupVideoSessionDto) {
    this.logger.log(
      `[sessions.backup-video] POST sessionId=${body.sessionId} provider=${body.provider ?? 'auto'}`,
    );
    return this.sessionsService.createBackupVideoSession(body);
  }

  /**
   * Mint a phone fallback (PSTN) instruction. Same auth caveat as backup-video.
   * Mock mode returns BACKUP_PHONE_NUMBER + a deterministic conference code.
   */
  @Post('phone-fallback')
  createPhoneFallback(@Body() body: CreatePhoneFallbackDto) {
    this.logger.log(
      `[sessions.phone-fallback] POST sessionId=${body.sessionId} provider=${body.provider ?? 'auto'}`,
    );
    return this.sessionsService.createPhoneFallback(body);
  }
}
