import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminGuard } from './admin.guard';
import { CmsService } from './cms.service';
import { HomeSectionUpsertDto } from './dto/home-section.dto';
import { PatchFieldDto } from './dto/patch-field.dto';

type MulterFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Controller('cms/admin')
@UseGuards(AdminGuard)
export class CmsAdminController {
  constructor(private readonly cms: CmsService) {}

  @Post('bundle-refresh')
  async bundleRefresh() {
    return { ok: true, message: 'Client should refetch GET /api/cms/bundle' };
  }

  @Post('patch-field')
  async patchField(@Body() body: PatchFieldDto) {
    return this.cms.patchField(body);
  }

  @Post('home-sections')
  async upsertHomeSection(@Body() body: HomeSectionUpsertDto) {
    return this.cms.upsertHomeSection(body);
  }

  @Delete('home-sections/:id')
  async deleteHomeSection(@Param('id') id: string) {
    return this.cms.deleteHomeSection(id);
  }

  @Post('media/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
    }),
  )
  async uploadMedia(@UploadedFile() file: MulterFile | undefined) {
    if (!file?.buffer?.length) {
      return { error: 'Missing file' };
    }
    const row = await this.cms.saveUploadedMedia({
      originalName: file.originalname || 'upload.bin',
      mimeType: file.mimetype || 'application/octet-stream',
      buffer: file.buffer,
    });
    return { media: row };
  }

  @Post('doctors/:doctorId/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
    }),
  )
  async uploadDoctorAvatar(
    @Param('doctorId') doctorId: string,
    @UploadedFile() file: MulterFile | undefined,
  ) {
    if (!file?.buffer?.length) {
      return { error: 'Missing file' };
    }
    const media = await this.cms.saveUploadedMedia({
      originalName: file.originalname || 'avatar.bin',
      mimeType: file.mimetype || 'application/octet-stream',
      buffer: file.buffer,
    });
    await this.cms.replaceDoctorAvatar(doctorId, media.id);
    return { media, doctorId };
  }

  @Post('testimonials/:testimonialId/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
    }),
  )
  async uploadTestimonialAvatar(
    @Param('testimonialId') testimonialId: string,
    @UploadedFile() file: MulterFile | undefined,
  ) {
    if (!file?.buffer?.length) {
      return { error: 'Missing file' };
    }
    const media = await this.cms.saveUploadedMedia({
      originalName: file.originalname || 'avatar.bin',
      mimeType: file.mimetype || 'application/octet-stream',
      buffer: file.buffer,
    });
    await this.cms.replaceTestimonialAvatar(testimonialId, media.id);
    return { media, testimonialId };
  }
}
