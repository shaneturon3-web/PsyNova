import { Body, Controller, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { TranslationService } from './translation.service';

class TranslateDto {
  @IsString()
  @MaxLength(8000)
  text!: string;

  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en', 'es'])
  sourceLang?: string;
}

/**
 * Optional client-side preview of French translation (same logic as form submit).
 * Rate-limit in production; open for mockup demos.
 */
@Controller('translate')
export class TranslationController {
  constructor(private readonly translation: TranslationService) {}

  @Post()
  async translate(@Body() body: TranslateDto) {
    const src = body.sourceLang || 'en';
    const result = await this.translation.translateToFrench(body.text, src);
    return {
      translatedText: result.text,
      provider: result.provider,
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }
}
