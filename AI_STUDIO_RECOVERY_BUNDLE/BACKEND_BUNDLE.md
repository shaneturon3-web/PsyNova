# BACKEND BUNDLE

Paths relative to `AI_STUDIO_RECOVERY_BUNDLE/`.

===== FILE: app/backend/package.json =====

```json
{
  "name": "psynova-backend",
  "version": "0.1.0",
  "private": true,
  "description": "PsyNova NestJS API [MOCKUP PURPOSE ONLY - NOT REAL DATA]",
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "bash ../ops/port_guard_3000.sh && nest start --watch",
    "start:prod": "node dist/main.js",
    "db:migrate:local": "bash scripts/migrate.sh",
    "db:seed:test": "bash scripts/seed_test.sh",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^11.1.2",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "pg": "^8.13.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.4",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.2",
    "@types/pg": "^8.11.10",
    "@types/supertest": "^6.0.2",
    "@typescript-eslint/eslint-plugin": "^8.18.2",
    "@typescript-eslint/parser": "^8.18.2",
    "eslint": "^9.17.0",
    "eslint-config-prettier": "^9.1.0",
    "jest": "^29.7.0",
    "prettier": "^3.4.2",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.2"
  }
}
```

===== FILE: app/backend/src/app.module.ts =====

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { CmsModule } from './cms/cms.module';
import { DatabaseModule } from './database/database.module';
import { FormsModule } from './forms/forms.module';
import { HealthModule } from './health/health.module';
import { TranslationModule } from './translation/translation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    CmsModule,
    TranslationModule,
    FormsModule,
    AppointmentsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

===== FILE: app/backend/src/appointments/appointments.controller.ts =====

```typescript
import { Body, Controller, Get, Logger, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';

@Controller('appointments')
@UseGuards(AuthTokenGuard)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() payload: CreateAppointmentDto, @Req() req: Request & { authUser?: { sub?: string } }) {
    this.logger.log(
      `[appointments.create] ${req.method} ${req.originalUrl} authUser=${req.authUser?.sub ?? 'missing'}`,
    );
    return this.appointmentsService.create(payload);
  }

  @Get()
  findAll(@Query() query: ListAppointmentsQueryDto, @Req() req: Request & { authUser?: { sub?: string } }) {
    this.logger.log(
      `[appointments.findAll] ${req.method} ${req.originalUrl} authUser=${req.authUser?.sub ?? 'missing'}`,
    );
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request & { authUser?: { sub?: string } }) {
    this.logger.log(
      `[appointments.findOne] ${req.method} ${req.originalUrl} authUser=${req.authUser?.sub ?? 'missing'}`,
    );
    return this.appointmentsService.findOne(id);
  }
}
```

===== FILE: app/backend/src/appointments/appointments.module.ts =====

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthTokenGuard } from '../auth/guards/auth-token.guard';
import { TranslationModule } from '../translation/translation.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [AuthModule, TranslationModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AuthTokenGuard],
})
export class AppointmentsModule {}
```

===== FILE: app/backend/src/appointments/appointments.service.ts =====

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { TranslationService } from '../translation/translation.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';

type Appointment = {
  id: string;
  patientId: string;
  clinicianId: string;
  startsAt: string;
  endsAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  serviceCategory: string | null;
  createdAt: string;
  sessionNotesOriginal: string | null;
  sessionNotesClientLanguage: string | null;
  sessionNotesInternalFr: string | null;
  sessionNotesTranslationProvider: string | null;
};

@Injectable()
export class AppointmentsService {
  private readonly appointments = new Map<string, Appointment>();
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly translation: TranslationService,
  ) {}

  async create(payload: CreateAppointmentDto) {
    let notesOriginal: string | null = null;
    let notesLang: string | null = null;
    let notesFr: string | null = null;
    let notesProvider: string | null = null;

    if (payload.sessionNotes?.trim()) {
      notesOriginal = payload.sessionNotes.trim();
      notesLang = payload.sessionNotesClientLanguage || 'fr';
      const tr = await this.translation.translateToFrench(notesOriginal, notesLang);
      notesFr = tr.text;
      notesProvider = tr.provider;
    }

    const appointment: Appointment = {
      id: randomUUID(),
      patientId: payload.patientId,
      clinicianId: payload.clinicianId,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      status: payload.status,
      serviceCategory: payload.serviceCategory ?? null,
      createdAt: new Date().toISOString(),
      sessionNotesOriginal: notesOriginal,
      sessionNotesClientLanguage: notesLang,
      sessionNotesInternalFr: notesFr,
      sessionNotesTranslationProvider: notesProvider,
    };

    if (this.databaseService.isEnabled()) {
      await this.databaseService.query(
        `INSERT INTO appointments (id, patient_id, clinician_id, starts_at, ends_at, status, service_category,
          session_notes_original, session_notes_client_language, session_notes_internal_fr, session_notes_translation_provider)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          appointment.id,
          appointment.patientId,
          appointment.clinicianId,
          appointment.startsAt,
          appointment.endsAt,
          appointment.status,
          appointment.serviceCategory,
          appointment.sessionNotesOriginal,
          appointment.sessionNotesClientLanguage,
          appointment.sessionNotesInternalFr,
          appointment.sessionNotesTranslationProvider,
        ],
      );
    }
    this.appointments.set(appointment.id, appointment);
    return {
      appointment: this.toPublicAppointment(appointment),
      tag: '[DRAFT]',
    };
  }

  /** Patient-facing list: show original notes only; internal FR omitted here for privacy in mockup. */
  private toPublicAppointment(a: Appointment) {
    return {
      id: a.id,
      patientId: a.patientId,
      clinicianId: a.clinicianId,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      status: a.status,
      serviceCategory: a.serviceCategory,
      createdAt: a.createdAt,
      sessionNotesOriginal: a.sessionNotesOriginal,
      sessionNotesClientLanguage: a.sessionNotesClientLanguage,
    };
  }

  private mapRow(row: Record<string, unknown>): Appointment {
    return {
      id: String(row.id),
      patientId: String(row.patient_id),
      clinicianId: String(row.clinician_id),
      startsAt: String(row.starts_at),
      endsAt: String(row.ends_at),
      status: row.status as Appointment['status'],
      serviceCategory: (row.service_category as string) ?? null,
      createdAt: String(row.created_at),
      sessionNotesOriginal: (row.session_notes_original as string) ?? null,
      sessionNotesClientLanguage: (row.session_notes_client_language as string) ?? null,
      sessionNotesInternalFr: (row.session_notes_internal_fr as string) ?? null,
      sessionNotesTranslationProvider: (row.session_notes_translation_provider as string) ?? null,
    };
  }

  async findAll(query: ListAppointmentsQueryDto) {
    if (this.databaseService.isEnabled()) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (query.patientId) {
        params.push(query.patientId);
        where.push(`patient_id = $${params.length}`);
      }
      if (query.clinicianId) {
        params.push(query.clinicianId);
        where.push(`clinician_id = $${params.length}`);
      }
      if (query.status) {
        params.push(query.status);
        where.push(`status = $${params.length}`);
      }
      const sql = `SELECT id, patient_id, clinician_id, starts_at, ends_at, status, service_category, created_at,
                          session_notes_original, session_notes_client_language, session_notes_internal_fr, session_notes_translation_provider
                   FROM appointments
                   ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                   ORDER BY created_at DESC`;
      const result = await this.databaseService.query(sql, params);

      const items = result.rows.map((row) => this.toPublicAppointment(this.mapRow(row as Record<string, unknown>)));
      return { items, count: items.length };
    }

    const items = [...this.appointments.values()]
      .filter((item) => {
        if (query.patientId && item.patientId !== query.patientId) return false;
        if (query.clinicianId && item.clinicianId !== query.clinicianId) return false;
        if (query.status && item.status !== query.status) return false;
        return true;
      })
      .map((a) => this.toPublicAppointment(a));
    return { items, count: items.length };
  }

  async findOne(id: string) {
    if (this.databaseService.isEnabled()) {
      const result = await this.databaseService.query(
        `SELECT id, patient_id, clinician_id, starts_at, ends_at, status, service_category, created_at,
                session_notes_original, session_notes_client_language, session_notes_internal_fr, session_notes_translation_provider
         FROM appointments WHERE id = $1`,
        [id],
      );

      if (!result.rows[0]) {
        throw new NotFoundException('Appointment not found');
      }

      return this.toPublicAppointment(this.mapRow(result.rows[0] as Record<string, unknown>));
    }

    const appointment = this.appointments.get(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return this.toPublicAppointment(appointment);
  }
}
```

===== FILE: app/backend/src/appointments/dto/create-appointment.dto.ts =====

```typescript
import { IsDateString, IsIn, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  clinicianId!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsIn(['pending', 'confirmed', 'cancelled'])
  status!: 'pending' | 'confirmed' | 'cancelled';

  /** DRAFT: slug from frontend `service-categories.js` catalog */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  serviceCategory?: string;

  /** Free text from patient; stored as-is + French copy for internal mockup use */
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  sessionNotes?: string;

  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en', 'es'])
  sessionNotesClientLanguage?: string;
}
```

===== FILE: app/backend/src/appointments/dto/list-appointments-query.dto.ts =====

```typescript
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class ListAppointmentsQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  clinicianId?: string;

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'cancelled';
}
```

===== FILE: app/backend/src/auth/auth.controller.ts =====

```typescript
import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post('logout')
  logout(@Headers('authorization') authorizationHeader?: string) {
    return this.authService.logout(authorizationHeader);
  }

  @Post('refresh')
  refresh(@Headers('authorization') authorizationHeader?: string) {
    return this.authService.refresh(authorizationHeader);
  }

  @Get('me')
  me(@Headers('authorization') authorizationHeader?: string) {
    const payload = this.authService.verifyAccessToken(authorizationHeader);
    return {
      user: payload,
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }
}
```

===== FILE: app/backend/src/auth/auth.module.ts =====

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

===== FILE: app/backend/src/auth/auth.service.ts =====

```typescript
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { createDevAuthPayload, isDevelopmentAuthBypass } from './dev-auth-bypass';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: 'patient' | 'clinician' | 'admin';
  preferredLanguage: 'en' | 'fr' | 'es';
};

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: 'patient' | 'clinician' | 'admin';
  preferredLanguage: 'en' | 'fr' | 'es';
  jti: string;
  iat: number;
  exp: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly users = new Map<string, AuthUser>();
  private readonly revokedTokens = new Set<string>();
  private readonly activeAccessTokenByEmail = new Map<string, string>();
  constructor(private readonly databaseService: DatabaseService) {}

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const [salt, expectedHash] = storedHash.split(':');
    if (!salt || !expectedHash) {
      return false;
    }

    const derived = scryptSync(password, salt, 64).toString('hex');
    return timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(expectedHash, 'hex'));
  }

  private createSignedToken(user: AuthUser): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresInSeconds = Number(process.env.JWT_EXPIRES_IN_SECONDS || 3600);
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        jti: randomUUID(),
        iat: issuedAt,
        exp: issuedAt + expiresInSeconds,
      }),
    ).toString('base64url');
    const signature = this.signParts(header, payload);
    return `${header}.${payload}.${signature}`;
  }

  private signParts(header: string, payload: string): string {
    const secret = this.getJwtSecret();
    return scryptSync(`${header}.${payload}`, secret, 32).toString('base64url');
  }

  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET || 'psynova_dev_secret_change_me';
    if (process.env.NODE_ENV === 'production' && secret === 'psynova_dev_secret_change_me') {
      throw new UnauthorizedException('JWT secret misconfigured');
    }
    return secret;
  }

  private issueAccessToken(user: AuthUser): string {
    const token = this.createSignedToken(user);
    this.activeAccessTokenByEmail.set(user.email, token);
    return token;
  }

  private extractToken(value?: string): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed.startsWith('Bearer ')) {
      return trimmed.slice(7).trim() || null;
    }
    return trimmed || null;
  }

  verifyAccessToken(rawToken?: string): AccessTokenPayload {
    const tokenHint = rawToken ? `${rawToken.slice(0, 24)}...` : 'missing';
    this.logger.log(`[verifyAccessToken] start token=${tokenHint}`);
    if (isDevelopmentAuthBypass()) {
      const payload = createDevAuthPayload() as AccessTokenPayload;
      this.logger.warn(
        `[verifyAccessToken] development bypass active; returning mock payload sub=${payload.sub}`,
      );
      return payload;
    }
    const token = this.extractToken(rawToken);
    if (!token) {
      this.logger.warn('[verifyAccessToken] rejected: Missing token');
      throw new UnauthorizedException('Missing token');
    }
    if (this.revokedTokens.has(token)) {
      this.logger.warn('[verifyAccessToken] rejected: Token revoked');
      throw new UnauthorizedException('Token revoked');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      this.logger.warn(`[verifyAccessToken] rejected: Invalid token format parts=${parts.length}`);
      throw new UnauthorizedException('Invalid token format');
    }

    const [header, payload, signature] = parts;
    const expectedSignature = this.signParts(header, payload);
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      this.logger.warn('[verifyAccessToken] rejected: Invalid token signature');
      throw new UnauthorizedException('Invalid token signature');
    }

    try {
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AccessTokenPayload;
      if (typeof parsed.exp !== 'number' || parsed.exp <= Math.floor(Date.now() / 1000)) {
        this.logger.warn('[verifyAccessToken] rejected: Token expired');
        throw new UnauthorizedException('Token expired');
      }
      const activeToken = this.activeAccessTokenByEmail.get(parsed.email);
      if (activeToken && activeToken !== token) {
        this.logger.warn(
          `[verifyAccessToken] rejected: Token rotated email=${parsed.email} activeTokenMismatch=true`,
        );
        throw new UnauthorizedException('Token rotated');
      }
      this.logger.log(
        `[verifyAccessToken] success sub=${parsed.sub} email=${parsed.email} role=${parsed.role}`,
      );
      return parsed;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `[verifyAccessToken] rejected: Invalid token payload parse error=${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid token payload');
    }
  }

  /** Returns null if missing/invalid/expired — for optional auth (e.g. CMS preview). */
  tryVerifyAccessToken(rawToken?: string): AccessTokenPayload | null {
    try {
      return this.verifyAccessToken(rawToken);
    } catch {
      return null;
    }
  }

  async register(payload: RegisterDto) {
    const passwordHash = this.hashPassword(payload.password);
    const user: AuthUser = {
      id: randomUUID(),
      email: payload.email.toLowerCase(),
      passwordHash,
      role: payload.role,
      preferredLanguage: payload.preferredLanguage,
    };

    if (this.databaseService.isEnabled()) {
      const result = await this.databaseService.query<{
        id: string;
        email: string;
        role: AuthUser['role'];
        preferred_language: AuthUser['preferredLanguage'];
      }>(
        `INSERT INTO users (id, role, preferred_language, email, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET
           role = EXCLUDED.role,
           preferred_language = EXCLUDED.preferred_language,
           password_hash = EXCLUDED.password_hash
         RETURNING id, email, role, preferred_language`,
        [user.id, user.role, user.preferredLanguage, user.email, user.passwordHash],
      );
      const row = result.rows[0];
      if (row) {
        user.id = row.id;
        user.email = row.email;
        user.role = row.role;
        user.preferredLanguage = row.preferred_language;
      }
    }

    this.users.set(user.email, user);
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }

  async login(payload: LoginDto) {
    const email = payload.email.toLowerCase();
    let user = this.users.get(email);

    if (!user && this.databaseService.isEnabled()) {
      const result = await this.databaseService.query<{
        id: string;
        email: string;
        password_hash: string;
        role: 'patient' | 'clinician' | 'admin';
        preferred_language: 'en' | 'fr' | 'es';
      }>('SELECT id, email, password_hash, role, preferred_language FROM users WHERE email = $1', [
        email,
      ]);
      if (result.rows[0]) {
        user = {
          id: result.rows[0].id,
          email: result.rows[0].email,
          passwordHash: result.rows[0].password_hash,
          role: result.rows[0].role,
          preferredLanguage: result.rows[0].preferred_language,
        };
      }
    }

    if (!user || !this.verifyPassword(payload.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: this.issueAccessToken(user),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }

  logout(rawToken?: string) {
    const token = this.extractToken(rawToken);
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const payload = this.verifyAccessToken(token);
    this.revokedTokens.add(token);
    const activeToken = this.activeAccessTokenByEmail.get(payload.email);
    if (activeToken === token) {
      this.activeAccessTokenByEmail.delete(payload.email);
    }
    return {
      revoked: true,
      tokenHint: `${token.slice(0, 12)}...`,
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }

  refresh(rawToken?: string) {
    const token = this.extractToken(rawToken);
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const payload = this.verifyAccessToken(token);
    const currentUser = this.users.get(payload.email);
    if (!currentUser) {
      throw new UnauthorizedException('User not found');
    }

    this.revokedTokens.add(token);
    const accessToken = this.issueAccessToken(currentUser);
    return {
      accessToken,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        preferredLanguage: currentUser.preferredLanguage,
      },
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }
}
```

===== FILE: app/backend/src/auth/dev-auth-bypass.ts =====

```typescript
import type { Request } from 'express';

/** Mirrors JwtAuthGuard-style bypass: dev env or explicit flag (no Passport in this project). */
export function isDevelopmentAuthBypass(): boolean {
  return (
    process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH === 'true'
  );
}

const DEV_MOCK_USER = {
  id: 'dev-user-123',
  email: 'dev@psynova.local',
  roles: ['admin', 'therapist'],
} as const;

export function createDevAuthPayload() {
  return {
    sub: DEV_MOCK_USER.id,
    email: DEV_MOCK_USER.email,
    role: 'admin' as const,
    preferredLanguage: 'en' as const,
    jti: 'dev-bypass',
    iat: 0,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}

/** Populates `user` (and `authUser` payload shape) so controllers and services see a consistent principal. */
export function applyDevAuthBypassToRequest(
  request: Request & { user?: unknown; authUser?: unknown },
): void {
  request.user = { ...DEV_MOCK_USER };
  request.authUser = createDevAuthPayload();
}
```

===== FILE: app/backend/src/auth/dto/login.dto.ts =====

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
```

===== FILE: app/backend/src/auth/dto/register.dto.ts =====

```typescript
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
```

===== FILE: app/backend/src/auth/guards/auth-token.guard.ts =====

```typescript
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { applyDevAuthBypassToRequest, isDevelopmentAuthBypass } from '../dev-auth-bypass';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  private readonly logger = new Logger(AuthTokenGuard.name);

  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      Request & { user?: unknown; authUser?: unknown }
    >();
    const requestId = request.headers['x-request-id'] ?? 'none';
    const authHeader = request.headers.authorization;
    const authHeaderPreview = authHeader ? `${authHeader.slice(0, 24)}...` : 'missing';
    this.logger.log(
      `[requestId=${requestId}] canActivate ${request.method} ${request.originalUrl} authHeader=${authHeaderPreview}`,
    );

    if (isDevelopmentAuthBypass()) {
      applyDevAuthBypassToRequest(request);
      this.logger.warn(
        `[requestId=${requestId}] Development auth bypass enabled for ${request.method} ${request.originalUrl}`,
      );
      return true;
    }

    try {
      const payload = this.authService.verifyAccessToken(request.headers.authorization);
      (request as Request & { authUser?: unknown }).authUser = payload;
      this.logger.log(
        `[requestId=${requestId}] auth accepted sub=${payload.sub} role=${payload.role} exp=${payload.exp}`,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[requestId=${requestId}] auth rejected ${request.method} ${request.originalUrl}: ${message}`,
      );
      throw error;
    }
  }
}
```

===== FILE: app/backend/src/main.ts =====

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, type NextFunction, type Request, type Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const started = Date.now();
    const requestId = req.headers['x-request-id'] ?? 'none';
    const authHeader = req.headers.authorization;
    const authHeaderPreview = authHeader ? `${authHeader.slice(0, 24)}...` : 'missing';
    console.log(
      `[ingress] requestId=${requestId} ${req.method} ${req.originalUrl} authHeader=${authHeaderPreview}`,
    );
    res.on('finish', () => {
      console.log(
        `[egress] requestId=${requestId} ${req.method} ${req.originalUrl} status=${res.statusCode} durationMs=${Date.now() - started}`,
      );
    });
    next();
  });
  app.use(json({ limit: '5mb' }));
  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const originList = [...defaultOrigins, ...extra];
  app.enableCors({
    origin: originList.length ? originList : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  // ASCII-only: non-ASCII or fragile punctuation in response headers can break proxies / 500s.
  const maquetteHeader = 'MOCKUP-PURPOSE-ONLY';
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-PsyNova-Maquette', maquetteHeader);
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PsyNova Backend API')
    .setDescription(
      '**Mockup API — no real clinical services.**\n\n' +
        'MOCKUP-PURPOSE-ONLY (no real services or data).\n\n' +
        'Every response includes header `X-PsyNova-Maquette` with the same canonical notice.',
    )
    .setVersion('0.1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
```
