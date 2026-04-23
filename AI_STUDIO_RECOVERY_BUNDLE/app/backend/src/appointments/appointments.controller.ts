import { Body, Controller, Get, Logger, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';

@Controller('appointments')
@UseGuards(AuthTokenGuard)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() payload: CreateAppointmentDto, @Req() req: Request & { authUser?: { sub?: string } }) {
    this.logger.log(
      `[appointments.create] ${req.method} ${req.originalUrl} authUser=${req.authUser?.sub ?? 'missing'}`,
    );
    return this.appointmentsService.create(payload);
  }

  @Get()
  findAll(@Query() query: ListAppointmentsQueryDto, @Req() req: Request & { authUser?: { sub?: string } }) {
    this.logger.log(
      `[appointments.findAll] ${req.method} ${req.originalUrl} authUser=${req.authUser?.sub ?? 'missing'}`,
    );
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request & { authUser?: { sub?: string } }) {
    this.logger.log(
      `[appointments.findOne] ${req.method} ${req.originalUrl} authUser=${req.authUser?.sub ?? 'missing'}`,
    );
    return this.appointmentsService.findOne(id);
  }
}
