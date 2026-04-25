import { Module } from '@nestjs/common';
import { VendorLinksController } from './vendor-links.controller';
import { VendorLinksService } from './vendor-links.service';

@Module({
  controllers: [VendorLinksController],
  providers: [VendorLinksService],
  exports: [VendorLinksService],
})
export class VendorLinksModule {}
