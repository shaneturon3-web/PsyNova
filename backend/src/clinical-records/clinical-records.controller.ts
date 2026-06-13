import { Body, Controller, Get, Logger, Param, Patch, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { ClinicalRecordsService } from './clinical-records.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { CreateNoteDto, ListNotesQueryDto, UpdateNoteDto } from './dto/create-note.dto';

type ReqUser = Request & { authUser?: { sub?: string } };

type MulterFile = { buffer: Buffer; originalname: string; mimetype: string };

@Controller('clinical')
@UseGuards(AuthTokenGuard)
export class ClinicalRecordsController {
  private readonly logger = new Logger(ClinicalRecordsController.name);
  constructor(private readonly svc: ClinicalRecordsService) {}

  @Get('patients/:id/chart')
  chart(@Param('id') id: string) { return this.svc.chart(id); }

  @Get('notes')
  listNotes(@Query() q: ListNotesQueryDto) { return this.svc.listNotes(q); }

  @Get('notes/:id')
  findNote(@Param('id') id: string) { return this.svc.findNote(id); }

  @Post('notes')
  createNote(@Body() dto: CreateNoteDto, @Req() req: ReqUser) {
    this.logger.log(`[clinical.note.create] type=${dto.noteType} by=${req.authUser?.sub}`);
    return this.svc.createNote(dto, req.authUser?.sub);
  }

  @Patch('notes/:id')
  updateNote(@Param('id') id: string, @Body() dto: UpdateNoteDto, @Req() req: ReqUser) {
    return this.svc.updateNote(id, dto, req.authUser?.sub);
  }

  @Post('notes/:id/sign')
  signNote(@Param('id') id: string, @Req() req: ReqUser) {
    return this.svc.signNote(id, req.authUser?.sub);
  }

  @Get('notes/:id/revisions')
  noteRevisions(@Param('id') id: string) { return this.svc.noteRevisions(id); }

  @Get('notes/:id/export.pdf')
  async notePdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.svc.notePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="note-${id.slice(0, 8)}.pdf"`);
    res.send(pdf);
  }

  @Get('consents')
  listConsents(@Query('patientId') patientId: string) { return this.svc.listConsents(patientId); }

  @Post('consents')
  createConsent(@Body() dto: CreateConsentDto, @Req() req: ReqUser) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.svc.createConsent(dto, ip, ua as string | undefined, req.authUser?.sub);
  }

  @Post('attachments')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  uploadAttachment(@UploadedFile() file: MulterFile, @Body() body: { patientId?: string; noteId?: string }, @Req() req: ReqUser) {
    if (!body.patientId) throw new Error('patientId required');
    return this.svc.addAttachment(body.patientId, file, body.noteId, req.authUser?.sub ?? 'unknown');
  }

  @Get('attachments/:id')
  async getAttachment(@Param('id') id: string, @Res() res: Response) {
    const { buffer, mimeType, filename } = await this.svc.getAttachmentBytes(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('audit')
  audit(@Query() q: { actorId?: string; entityId?: string; entityType?: string; from?: string; to?: string }) {
    return this.svc.listAudit(q);
  }

  @Get('audit/verify')
  verifyAudit() { return this.svc.verifyAudit(); }
}
