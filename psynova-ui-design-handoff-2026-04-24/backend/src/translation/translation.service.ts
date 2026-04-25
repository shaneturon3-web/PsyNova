import { Injectable, Logger } from '@nestjs/common';

export type TranslateResult = {
  text: string;
  provider: 'deepl' | 'google' | 'none';
  sourceLanguage: string;
  targetLanguage: 'fr';
};

/** Maps UI / ISO codes to DeepL source_lang (omit for auto). */
const DEEPL_SOURCE: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
};

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  /**
   * Produces a French (primary clinic language) string for internal review.
   * Stores original client-side; this result is for staff-side mockup display only.
   */
  async translateToFrench(text: string, clientLanguage: string): Promise<TranslateResult> {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return { text: '', provider: 'none', sourceLanguage: clientLanguage || 'und', targetLanguage: 'fr' };
    }
    const src = (clientLanguage || 'fr').toLowerCase().slice(0, 5);
    if (src.startsWith('fr')) {
      return {
        text: trimmed,
        provider: 'none',
        sourceLanguage: 'fr',
        targetLanguage: 'fr',
      };
    }

    const deepl = await this.tryDeepL(trimmed, src);
    if (deepl) return deepl;

    const google = await this.tryGoogle(trimmed, src);
    if (google) return google;

    this.logger.warn('No translation API configured; returning original text with marker.');
    return {
      text: `[Traduction auto indisponible — texte original conservé]\n${trimmed}`,
      provider: 'none',
      sourceLanguage: src,
      targetLanguage: 'fr',
    };
  }

  private async tryDeepL(text: string, src: string): Promise<TranslateResult | null> {
    const key = process.env.DEEPL_API_KEY?.trim();
    if (!key) return null;
    const endpoint = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';
    const sourceLang = DEEPL_SOURCE[src] || undefined;
    const body = new URLSearchParams();
    body.set('auth_key', key);
    body.set('text', text);
    body.set('target_lang', 'FR');
    if (sourceLang) body.set('source_lang', sourceLang);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) {
        this.logger.warn(`DeepL HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as {
        translations?: Array<{ text: string; detected_source_language?: string }>;
      };
      const out = data.translations?.[0]?.text;
      if (!out) return null;
      return {
        text: out,
        provider: 'deepl',
        sourceLanguage: data.translations?.[0]?.detected_source_language || src,
        targetLanguage: 'fr',
      };
    } catch (e) {
      this.logger.warn(`DeepL error: ${(e as Error).message}`);
      return null;
    }
  }

  private async tryGoogle(text: string, src: string): Promise<TranslateResult | null> {
    const key = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
    if (!key) return null;
    const url = new URL('https://translation.googleapis.com/language/translate/v2');
    url.searchParams.set('key', key);
    try {
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: [text],
          target: 'fr',
          format: 'text',
          ...(src.startsWith('es')
            ? { source: 'es' }
            : src.startsWith('en')
              ? { source: 'en' }
              : {}),
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Google Translate HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as {
        data?: { translations?: Array<{ translatedText: string }> };
      };
      const out = data.data?.translations?.[0]?.translatedText;
      if (!out) return null;
      return {
        text: out,
        provider: 'google',
        sourceLanguage: src,
        targetLanguage: 'fr',
      };
    } catch (e) {
      this.logger.warn(`Google Translate error: ${(e as Error).message}`);
      return null;
    }
  }
}
