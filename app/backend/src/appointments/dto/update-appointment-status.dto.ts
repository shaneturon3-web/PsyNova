import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * PATCH /api/appointments/:id/status — body shape.
 * `reason` is appended to `session_notes_internal_fr` when status is `cancelled` so the
 * cancellation context survives in the same record without a new column.
 */
export class UpdateAppointmentStatusDto {
  @IsIn(['pending', 'confirmed', 'cancelled', 'completed'])
  status!: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
