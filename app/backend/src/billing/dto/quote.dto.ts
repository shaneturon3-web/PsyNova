import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteDto {
  @IsString() @MaxLength(64) serviceCode!: string;
  // Coerce from query string. ValidationPipe with `transform: true` plus @Type(() => Number)
  // converts "2500000" -> 2500000 before @IsInt runs.
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) annualIncomeCents?: number;
}
