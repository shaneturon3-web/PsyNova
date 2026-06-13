import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';

export class CreateAvailabilityDto {
  @IsUUID() clinicianId!: string;
  @IsIn(['recurring', 'one_off']) blockType!: 'recurring' | 'one_off';
  @IsOptional() @IsInt() @Min(0) weekdayMask?: number;
  @IsOptional() @Matches(/^\d{2}:\d{2}(:\d{2})?$/) startTime?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}(:\d{2})?$/) endTime?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsIn(['available', 'blocked']) kind?: 'available' | 'blocked';
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
