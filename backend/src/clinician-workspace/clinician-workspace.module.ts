import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClinicalRecordsModule } from '../clinical-records/clinical-records.module';
import { ClinicianWorkspaceController } from './clinician-workspace.controller';
import { ClinicianWorkspaceService } from './clinician-workspace.service';

@Module({
  imports: [AuthModule, ClinicalRecordsModule],
  controllers: [ClinicianWorkspaceController],
  providers: [ClinicianWorkspaceService],
  exports: [ClinicianWorkspaceService],
})
export class ClinicianWorkspaceModule {}
