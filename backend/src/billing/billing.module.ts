import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClinicalRecordsModule } from '../clinical-records/clinical-records.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  // AuthModule provides AuthService which AuthTokenGuard injects;
  // ClinicalRecordsModule exports AuditService for the audit-chain writes.
  imports: [AuthModule, ClinicalRecordsModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
