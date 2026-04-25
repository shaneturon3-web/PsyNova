import { IsDateString, IsIn, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  clinicianId!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsIn(['pending', 'confirmed', 'cancelled'])
  status!: 'pending' | 'confirmed' | 'cancelled';

  /** DRAFT: slug from frontend `service-categories.js` catalog */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  serviceCategory?: string;

  /** Free text from patient; stored as-is + French copy for internal mockup use */
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  sessionNotes?: string;

  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en', 'es'])
  sessionNotesClientLanguage?: string;
}
