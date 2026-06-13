import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClaimDto {
  @IsString() @MaxLength(64) serviceCode!: string;
  @IsOptional() @IsIn(['ramq', 'private_insurer', 'self_pay']) payer?: 'ramq' | 'private_insurer' | 'self_pay';
  @IsOptional() @IsString() @MaxLength(64) payerMemberId?: string;
  @IsOptional() @IsString() @MaxLength(64) diagnosisCode?: string;
}

export class ListClaimsQueryDto {
  @IsOptional() @IsString() patientId?: string;
  @IsOptional() @IsString() status?: string;
}
