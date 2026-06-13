import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { ClinicalRecordsModule } from './clinical-records/clinical-records.module';
import { ClinicianWorkspaceModule } from './clinician-workspace/clinician-workspace.module';
import { CmsModule } from './cms/cms.module';
import { DatabaseModule } from './database/database.module';
import { DevModule } from './dev/dev.module';
import { FormsModule } from './forms/forms.module';
import { HealthModule } from './health/health.module';
import { SessionsModule } from './sessions/sessions.module';
import { SimModule } from './sim/sim.module';
import { TelehealthModule } from './telehealth/telehealth.module';
import { TranslationModule } from './translation/translation.module';
import { VendorLinksModule } from './vendor-links/vendor-links.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    CmsModule,
    TranslationModule,
    FormsModule,
    AppointmentsModule,
    BillingModule,
    ClinicalRecordsModule,
    ClinicianWorkspaceModule,
    HealthModule,
    SessionsModule,
    SimModule,
    TelehealthModule,
    VendorLinksModule,
    DevModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
