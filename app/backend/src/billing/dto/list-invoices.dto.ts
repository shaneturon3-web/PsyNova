import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class ListInvoicesQueryDto {
  @IsOptional() @IsUUID() patientId?: string;
  @IsOptional() @IsUUID() clinicianId?: string;
  @IsOptional() @IsIn(['draft', 'open', 'paid', 'partial', 'void', 'uncollectible']) status?: string;
}
