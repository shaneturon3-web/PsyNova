import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TranslationModule } from '../translation/translation.module';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

@Module({
  imports: [DatabaseModule, TranslationModule],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
