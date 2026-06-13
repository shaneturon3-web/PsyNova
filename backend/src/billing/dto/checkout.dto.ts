import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsOptional() @IsString() @MaxLength(500) successUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) cancelUrl?: string;
  @IsOptional() @IsString() @MaxLength(254) customerEmail?: string;
}
