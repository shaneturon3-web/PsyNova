import { Controller, Get, Logger, NotFoundException } from '@nestjs/common';

/**
 * Dev-only helpers, gated to non-production environments.
 *
 * `GET /api/dev/test-accounts` exposes the deterministic seeded test logins so the SPA's
 * `#/app/test-accounts` page can render one-click sign-in buttons. In `production`, this
 * endpoint returns 404 — there are no real credentials to leak in any other env either,
 * but the gate is belt-and-suspenders against a misconfigured prod deployment.
 *
 * The accounts themselves are seeded by `app/backend/scripts/seed_test.sh` and use a
 * deterministic `qa-fixed-salt:` scrypt prefix that matches the verifier in AuthService.
 */
@Controller('dev')
export class DevController {
  private readonly logger = new Logger(DevController.name);

  @Get('test-accounts')
  testAccounts() {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn('[dev.test-accounts] blocked in production');
      throw new NotFoundException();
    }
    return {
      accounts: [
        {
          label: 'Patient (demo)',
          email: 'patient.demo@psynova.local',
          password: 'Patient!2026',
          role: 'patient',
          id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
        },
        {
          label: 'Clinician (demo)',
          email: 'clinician.demo@psynova.local',
          password: 'Clinician!2026',
          role: 'clinician',
          id: '00000000-0000-4000-8000-000000000001',
        },
        {
          label: 'Admin (demo)',
          email: 'admin.demo@psynova.local',
          password: 'Admin!2026',
          role: 'admin',
          id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
        },
      ],
      notice:
        'Dev/test accounts only. Seeded by `npm run db:seed:test`. Disabled when NODE_ENV=production.',
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }
}
