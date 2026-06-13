import { Controller, Get, Logger, Param } from '@nestjs/common';
import { TelehealthService } from './telehealth.service';

/**
 * Telehealth launch endpoint. Composes video (Zoom/Jitsi/Daily/Whereby), mock chat,
 * notes pointer, and consent checklist into a single payload the SPA can render in one fetch.
 *
 * Auth caveat: not guarded today (matches /api/sessions). When real provider integrations land,
 * this should require AuthTokenGuard and verify the caller is a participant of the appointment.
 */
@Controller('telehealth')
export class TelehealthController {
  private readonly logger = new Logger(TelehealthController.name);
  constructor(private readonly telehealthService: TelehealthService) {}

  @Get('sessions/:id/launch')
  launch(@Param('id') id: string) {
    this.logger.log(`[telehealth.launch] GET sessions/${id}/launch`);
    return this.telehealthService.launch(id);
  }
}
