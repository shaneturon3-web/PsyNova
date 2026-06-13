import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * [DRAFT] Backup video session creation request.
 *
 * Provider modes:
 *   - `zoom`    : free Zoom dev app (Server-to-Server OAuth) when ZOOM_* keys present, mock otherwise.
 *   - `daily`   : free tier when DAILY_API_KEY present, mock otherwise.
 *   - `whereby` : free tier when WHEREBY_API_KEY present, mock otherwise.
 *   - `jitsi`   : always free public meet.jit.si rooms (gated by JITSI_PUBLIC_DEMO_ROOM=true).
 *
 * When `provider` is omitted, SessionsService picks the first configured provider
 * in the order zoom -> daily -> whereby -> jitsi.
 */
export class CreateBackupVideoSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sessionId!: string;

  @IsOptional()
  @IsIn(['zoom', 'daily', 'whereby', 'jitsi'])
  provider?: 'zoom' | 'daily' | 'whereby' | 'jitsi';
}
