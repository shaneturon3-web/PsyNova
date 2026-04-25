import { IsBoolean, IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class HomeSectionUpsertDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsString()
  sectionType!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
