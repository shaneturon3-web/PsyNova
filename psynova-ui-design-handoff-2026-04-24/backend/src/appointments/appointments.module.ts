import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { TranslationModule } from '../translation/translation.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [AuthModule, TranslationModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AuthTokenGuard],
})
export class AppointmentsModule {}
