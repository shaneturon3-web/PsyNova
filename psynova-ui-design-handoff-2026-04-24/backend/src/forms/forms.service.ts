import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { TranslationService } from '../translation/translation.service';
import { ContactFormDto } from './dto/contact-form.dto';

type ContactRecord = {
  id: string;
  name: string;
  email: string;
  messageOriginal: string;
  clientLanguage: string | null;
  messageInternalFr: string | null;
  translationProvider: string | null;
  createdAt: string;
};

@Injectable()
export class FormsService {
  private readonly memory: ContactRecord[] = [];

  constructor(
    private readonly db: DatabaseService,
    private readonly translation: TranslationService,
  ) {}

  async submitContact(dto: ContactFormDto) {
    const lang = dto.clientLanguage || 'fr';
    const tr = await this.translation.translateToFrench(dto.message, lang);

    const record: ContactRecord = {
      id: randomUUID(),
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      messageOriginal: dto.message,
      clientLanguage: lang,
      messageInternalFr: tr.text,
      translationProvider: tr.provider,
      createdAt: new Date().toISOString(),
    };

    if (this.db.isEnabled()) {
      await this.db.query(
        `INSERT INTO contact_submissions (id, name, email, message_original, client_language, message_internal_fr, translation_provider)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          record.id,
          record.name,
          record.email,
          record.messageOriginal,
          record.clientLanguage,
          record.messageInternalFr,
          record.translationProvider,
        ],
      );
    } else {
      this.memory.push(record);
    }

    return {
      id: record.id,
      received: true,
      translationProvider: record.translationProvider,
      tag: 'MOCKUP-PURPOSE-ONLY-NO-EMAIL',
    };
  }
}
