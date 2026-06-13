import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateZoomMeetingDto {
  @IsString()
  @MinLength(1)
  patientName!: string;

  @IsISO8601()
  startTime!: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;
}
