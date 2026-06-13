import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateThreadDto {
  @IsUUID() patientId!: string;
  @IsUUID() clinicianId!: string;
  @IsOptional() @IsString() @MaxLength(200) subject?: string;
  @IsOptional() @IsUUID() appointmentId?: string;
  @IsOptional() @IsString() @MaxLength(8000) initialMessage?: string;
}

export class CreateMessageDto {
  @IsString() @MinLength(1) @MaxLength(8000) body!: string;
}
