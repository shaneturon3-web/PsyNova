import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(['patient', 'clinician', 'admin'])
  role!: 'patient' | 'clinician' | 'admin';

  @IsIn(['en', 'fr', 'es'])
  preferredLanguage!: 'en' | 'fr' | 'es';
}
