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
