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
