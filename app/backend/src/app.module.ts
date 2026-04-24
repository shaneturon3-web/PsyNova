import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { CmsModule } from './cms/cms.module';
import { DatabaseModule } from './database/database.module';
import { FormsModule } from './forms/forms.module';
import { HealthModule } from './health/health.module';
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
    HealthModule,
    VendorLinksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
