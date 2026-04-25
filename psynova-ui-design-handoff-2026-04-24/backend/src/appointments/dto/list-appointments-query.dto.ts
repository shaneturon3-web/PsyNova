import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class ListAppointmentsQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  clinicianId?: string;

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'cancelled';
}
