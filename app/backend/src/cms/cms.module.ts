import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from './admin.guard';
import { CmsAdminController } from './cms-admin.controller';
import { CmsPublicController } from './cms-public.controller';
import { CmsService } from './cms.service';

@Module({
  imports: [AuthModule],
  controllers: [CmsPublicController, CmsAdminController],
  providers: [CmsService, AdminGuard],
  exports: [CmsService],
})
export class CmsModule {}
