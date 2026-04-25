import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { AuthService } from '../auth/auth.service';
import { CmsService } from './cms.service';

@Controller('cms')
export class CmsPublicController {
  constructor(
    private readonly cms: CmsService,
    private readonly auth: AuthService,
  ) {}

  /**
   * Published content by default. `preview=1` returns drafts only when Authorization is a valid admin JWT.
   */
  @Get('bundle')
  async bundle(
    @Query('preview') preview: string | undefined,
    @Headers('authorization') authorization?: string,
  ) {
    const wantsPreview = preview === '1' || preview === 'true';
    const payload = this.auth.tryVerifyAccessToken(authorization);
    const includeDrafts = wantsPreview && payload?.role === 'admin';
    return this.cms.getBundle(includeDrafts);
  }

  @Get('media/:id/file')
  async mediaFile(@Param('id') id: string, @Res() res: Response) {
    const m = await this.cms.getMediaById(id);
    if (!m) {
      throw new NotFoundException();
    }
    if (m.publicUrl) {
      return res.redirect(302, m.publicUrl);
    }
    if (!m.storagePath) {
      throw new NotFoundException();
    }
    const abs = join(process.cwd(), m.storagePath);
    const normalized = abs.replace(/\\/g, '/');
    const base = join(process.cwd(), 'uploads', 'cms').replace(/\\/g, '/');
    if (!normalized.startsWith(base)) {
      throw new NotFoundException();
    }
    if (!existsSync(abs)) {
      throw new NotFoundException();
    }
    res.setHeader('Content-Type', m.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    createReadStream(abs).pipe(res);
  }
}
