import { Module } from '@nestjs/common';
import { SessionsModule } from '../sessions/sessions.module';
import { JaneController } from './jane.controller';
import { JaneZoomService } from './jane-zoom.service';
import { ZoomController } from './zoom.controller';

@Module({
  imports: [SessionsModule],
  controllers: [ZoomController, JaneController],
  providers: [JaneZoomService],
  exports: [JaneZoomService],
})
export class JaneZoomModule {}
