import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditService } from './audit.service';
import { ClinicalRecordsController } from './clinical-records.controller';
import { ClinicalRecordsService } from './clinical-records.service';

@Module({
  imports: [AuthModule],
  controllers: [ClinicalRecordsController],
  providers: [AuditService, ClinicalRecordsService],
  // AuditService and ClinicalRecordsService are exported so Billing + Clinician Workspace
  // can append to the same audit chain and reuse note/consent helpers.
  exports: [AuditService, ClinicalRecordsService],
})
export class ClinicalRecordsModule {}
