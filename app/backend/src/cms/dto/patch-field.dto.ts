import { Allow, IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class PatchFieldDto {
  @IsIn(['doctor', 'service', 'testimonial', 'blogPost', 'media'])
  target!: 'doctor' | 'service' | 'testimonial' | 'blogPost' | 'media';

  @IsUUID()
  id!: string;

  @IsString()
  @IsNotEmpty()
  field!: string;

  @Allow()
  value!: unknown;
}
