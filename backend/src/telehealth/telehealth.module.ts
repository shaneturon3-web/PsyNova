import { Module } from '@nestjs/common';
import { SessionsModule } from '../sessions/sessions.module';
import { TelehealthController } from './telehealth.controller';
import { TelehealthService } from './telehealth.service';

/**
 * TelehealthModule composes the existing SessionsModule (video + phone) with mock chat and
 * a consent checklist into one launch payload. No new third-party calls beyond what
 * SessionsService already does.
 */
@Module({
  imports: [SessionsModule],
  controllers: [TelehealthController],
  providers: [TelehealthService],
})
export class TelehealthModule {}
