import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';

/**
 * DevModule — exposes safe dev/test helpers that are gated off in production.
 * Today: just `GET /api/dev/test-accounts`. Add cohort-reset, fixture re-seed, etc. here.
 */
@Module({
  controllers: [DevController],
})
export class DevModule {}
