import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateConsentDto {
  @IsUUID() patientId!: string;
  @IsString() @MaxLength(64) consentType!: string;
  @IsString() @MaxLength(32) consentVersion!: string;
  @IsOptional() @IsBoolean() accepted?: boolean;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
