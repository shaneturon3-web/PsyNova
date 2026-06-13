import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { SyncJaneDto } from './dto/sync-jane.dto';
import { JaneZoomService } from './jane-zoom.service';

@Controller('jane')
export class JaneController {
  private readonly logger = new Logger(JaneController.name);
  constructor(private readonly janeZoom: JaneZoomService) {}

  @Post('sync')
  sync(@Body() body: SyncJaneDto) {
    this.logger.log('[jane.sync] POST');
    return this.janeZoom.syncJaneFeed(body.feedUrl);
  }

  @Get('schedule')
  schedule() {
    return this.janeZoom.getTodaySchedule();
  }

  @Get('appointments/:id')
  appointment(@Param('id') id: string) {
    const row = this.janeZoom.getAppointment(id);
    if (!row) {
      return { error: 'not_found', id };
    }
    return row;
  }
}
