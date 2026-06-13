import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { ClinicianWorkspaceService } from './clinician-workspace.service';
import { CreateAvailabilityDto } from './dto/availability.dto';
import { CreateMessageDto, CreateThreadDto } from './dto/messaging.dto';
import { CreateTreatmentPlanDto, UpdateTreatmentPlanDto } from './dto/treatment-plan.dto';

type ReqUser = Request & { authUser?: { sub?: string; role?: string } };

@Controller('clinician')
@UseGuards(AuthTokenGuard)
export class ClinicianWorkspaceController {
  private readonly logger = new Logger(ClinicianWorkspaceController.name);
  constructor(private readonly svc: ClinicianWorkspaceService) {}

  @Get('me/dashboard')
  meDashboard(@Req() req: ReqUser) {
    if (!req.authUser?.sub) throw new BadRequestException('Auth required');
    return this.svc.dashboard(req.authUser.sub);
  }

  // Availability
  @Get('availability')
  listAvailability(@Query('clinicianId') clinicianId: string, @Req() req: ReqUser) {
    return this.svc.listAvailability(clinicianId || req.authUser?.sub || '');
  }
  @Post('availability')
  createAvailability(@Body() dto: CreateAvailabilityDto, @Req() req: ReqUser) {
    return this.svc.createAvailability(dto, req.authUser?.sub);
  }
  @Delete('availability/:id')
  deleteAvailability(@Param('id') id: string, @Req() req: ReqUser) {
    return this.svc.deleteAvailability(id, req.authUser?.sub);
  }

  // Treatment plans
  @Get('treatment-plans')
  listPlans(@Query('patientId') patientId: string) { return this.svc.listTreatmentPlans(patientId); }
  @Post('treatment-plans')
  createPlan(@Body() dto: CreateTreatmentPlanDto, @Req() req: ReqUser) {
    return this.svc.createTreatmentPlan(dto, req.authUser?.sub);
  }
  @Patch('treatment-plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdateTreatmentPlanDto, @Req() req: ReqUser) {
    return this.svc.updateTreatmentPlan(id, dto, req.authUser?.sub);
  }

  // Messaging
  @Get('messages/threads')
  listThreads(@Req() req: ReqUser) {
    if (!req.authUser?.sub) throw new BadRequestException('Auth required');
    return this.svc.listThreads(req.authUser.sub, req.authUser.role);
  }
  @Get('messages/threads/:id')
  findThread(@Param('id') id: string, @Req() req: ReqUser) {
    if (!req.authUser?.sub) throw new BadRequestException('Auth required');
    return this.svc.findThread(id, req.authUser.sub);
  }
  @Post('messages/threads')
  createThread(@Body() dto: CreateThreadDto, @Req() req: ReqUser) {
    return this.svc.createThread(dto, req.authUser?.sub);
  }
  @Post('messages/threads/:id/posts')
  addPost(@Param('id') id: string, @Body() dto: CreateMessageDto, @Req() req: ReqUser) {
    return this.svc.addMessage(id, dto, req.authUser?.sub);
  }

  // CDS
  @Get('cds/alerts')
  alerts(@Query('patientId') patientId: string | undefined, @Req() req: ReqUser) {
    return this.svc.listAlerts(patientId, req.authUser?.sub);
  }
  @Patch('cds/alerts/:id/resolve')
  resolveAlert(@Param('id') id: string, @Req() req: ReqUser) {
    return this.svc.resolveAlert(id, req.authUser?.sub);
  }
}
