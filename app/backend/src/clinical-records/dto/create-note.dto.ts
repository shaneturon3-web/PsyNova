import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsUUID() patientId!: string;
  @IsUUID() clinicianId!: string;
  @IsOptional() @IsUUID() appointmentId?: string;
  @IsIn(['intake', 'soap', 'progress', 'assessment']) noteType!: 'intake' | 'soap' | 'progress' | 'assessment';
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(20000) body?: string;
  @IsOptional() @IsString() @MaxLength(8000) subjective?: string;
  @IsOptional() @IsString() @MaxLength(8000) objective?: string;
  @IsOptional() @IsString() @MaxLength(8000) assessment?: string;
  @IsOptional() @IsString() @MaxLength(8000) plan?: string;
}

export class UpdateNoteDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(20000) body?: string;
  @IsOptional() @IsString() @MaxLength(8000) subjective?: string;
  @IsOptional() @IsString() @MaxLength(8000) objective?: string;
  @IsOptional() @IsString() @MaxLength(8000) assessment?: string;
  @IsOptional() @IsString() @MaxLength(8000) plan?: string;
}

export class ListNotesQueryDto {
  @IsOptional() @IsUUID() patientId?: string;
  @IsOptional() @IsUUID() clinicianId?: string;
  @IsOptional() @IsIn(['intake', 'soap', 'progress', 'assessment']) noteType?: string;
}
