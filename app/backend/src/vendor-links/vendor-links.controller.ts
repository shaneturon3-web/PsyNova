import { Controller, Get } from '@nestjs/common';
import { VendorLinksService } from './vendor-links.service';

@Controller('vendor-links')
export class VendorLinksController {
  constructor(private readonly vendorLinks: VendorLinksService) {}

  @Get()
  getPublicLinks() {
    return this.vendorLinks.getPublicLinks();
  }

  @Get('readiness')
  getReadiness() {
    return this.vendorLinks.getReadiness();
  }
}
