import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * [DRAFT] Phone fallback request when video providers are unreachable.
 *
 * Provider modes:
 *   - `twilio` : free trial (Twilio sandbox numbers, free outbound to verified numbers)
 *                Activated by TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER.
 *   - `telnyx` : PAID provider, wired stub. Activated by TELNYX_API_KEY (currently STUB).
 *   - `vonage` : PAID provider, wired stub. Activated by VONAGE_API_KEY (currently STUB).
 *
 * Without any keys, returns a deterministic mock conference number from BACKUP_PHONE_NUMBER
 * so the demo flow stays 100% functional.
 */
export class CreatePhoneFallbackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sessionId!: string;

  @IsOptional()
  @IsIn(['twilio', 'telnyx', 'vonage'])
  provider?: 'twilio' | 'telnyx' | 'vonage';

  /** E.164 number to call/SMS (e.g. "+15145550101"). Optional in mock mode. */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  toNumber?: string;
}
