import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { SimController } from './sim.controller';

@Module({
  imports: [BillingModule],
  controllers: [SimController],
})
export class SimModule {}
