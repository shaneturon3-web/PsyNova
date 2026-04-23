import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { applyDevAuthBypassToRequest, isDevelopmentAuthBypass } from '../auth/dev-auth-bypass';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    if (isDevelopmentAuthBypass()) {
      const req = context.switchToHttp().getRequest<
        Request & { user?: unknown; authUser?: unknown }
      >();
      applyDevAuthBypassToRequest(req);
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const raw = req.headers.authorization;
    const payload = this.auth.tryVerifyAccessToken(raw);
    if (!payload || payload.role !== 'admin') {
      throw new ForbiddenException('Admin role required');
    }
    return true;
  }
}
