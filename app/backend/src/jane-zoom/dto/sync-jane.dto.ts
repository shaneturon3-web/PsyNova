import { IsOptional, IsString } from 'class-validator';

export class SyncJaneDto {
  @IsOptional()
  @IsString()
  feedUrl?: string;
}
