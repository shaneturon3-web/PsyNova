import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { CreateZoomMeetingDto } from './dto/create-zoom-meeting.dto';
import { JaneZoomService } from './jane-zoom.service';

@Controller('zoom')
export class ZoomController {
  private readonly logger = new Logger(ZoomController.name);
  constructor(private readonly janeZoom: JaneZoomService) {}

  @Get('token')
  getToken() {
    return this.janeZoom.getZoomToken();
  }

  @Post('create-meeting')
  createMeeting(@Body() body: CreateZoomMeetingDto) {
    this.logger.log(`[zoom.create-meeting] patient=${body.patientName} start=${body.startTime}`);
    return this.janeZoom.createMeeting(body);
  }
}
