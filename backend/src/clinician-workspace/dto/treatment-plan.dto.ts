import { IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TreatmentGoalDto {
  @IsString() @MaxLength(500) description!: string;
  @IsOptional() @IsDateString() targetDate?: string;
  @IsOptional() @IsIn(['not_started', 'in_progress', 'achieved', 'abandoned']) status?: string;
  @IsOptional() @IsInt() @Min(0) position?: number;
}

export class CreateTreatmentPlanDto {
  @IsUUID() patientId!: string;
  @IsUUID() clinicianId!: string;
  @IsString() @MaxLength(200) title!: string;
  @IsOptional() @IsString() @MaxLength(200) diagnosis?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsIn(['draft', 'active', 'completed', 'cancelled']) status?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TreatmentGoalDto) goals?: TreatmentGoalDto[];
}

export class UpdateTreatmentPlanDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(200) diagnosis?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsIn(['draft', 'active', 'completed', 'cancelled']) status?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TreatmentGoalDto) goals?: TreatmentGoalDto[];
}
