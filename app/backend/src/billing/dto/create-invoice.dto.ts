import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsString() @MaxLength(500) description!: string;
  @IsOptional() @IsString() @MaxLength(64) serviceCode?: string;
  @IsInt() @Min(1) quantity!: number;
  @IsInt() @Min(0) unitPriceCents!: number;
}

export class CreateInvoiceDto {
  @IsUUID() patientId!: string;
  @IsUUID() clinicianId!: string;
  @IsOptional() @IsUUID() appointmentId?: string;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => InvoiceItemDto) items!: InvoiceItemDto[];
  @IsOptional() @IsInt() @Min(0) taxCents?: number;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsIn(['draft', 'open']) status?: 'draft' | 'open';
}
