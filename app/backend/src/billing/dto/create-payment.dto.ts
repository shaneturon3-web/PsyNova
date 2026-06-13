import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt() @Min(1) amountCents!: number;
  @IsOptional() @IsIn(['stripe', 'manual', 'simulator']) method?: 'stripe' | 'manual' | 'simulator';
  @IsOptional() @IsString() @MaxLength(128) externalId?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
