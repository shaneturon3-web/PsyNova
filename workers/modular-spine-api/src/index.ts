import type { Env } from './env';
import { handleStripeWebhook } from './handlers/billing';
import { handleHealth } from './handlers/health';
import { getPatientRecords } from './handlers/patients';
import { confirmAppointment, getTherapistAvailability } from './handlers/schedules';
import { handleStorageRequest } from './handlers/storage';
import { enforceAccessPerimeter } from './middleware/auth';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const denied = await enforceAccessPerimeter(request, env);
      if (denied) return denied;

      const url = new URL(request.url);
      const path = url.pathname;

      if (path === '/api/health' && request.method === 'GET') {
        return handleHealth(env);
      }

      if (path.startsWith('/api/storage/')) {
        return handleStorageRequest(request, env);
      }

      if (path === '/api/stripe/webhook' && request.method === 'POST') {
        return handleStripeWebhook(request, env);
      }

      if (path === '/api/patients' && request.method === 'GET') {
        return getPatientRecords(env);
      }

      if (path === '/api/schedules' && request.method === 'GET') {
        return getTherapistAvailability(env, url.searchParams.get('therapistId') ?? undefined);
      }

      const confirmMatch = path.match(/^\/api\/schedules\/([^/]+)\/confirm$/);
      if (confirmMatch && request.method === 'POST') {
        return confirmAppointment(env, confirmMatch[1]);
      }

      if (path.startsWith('/admin/') || path.startsWith('/professional/')) {
        return Response.json({
          ok: true,
          perimeter: 'access_jwt_required',
          path,
          metric: '6 hours per week',
        });
      }

      return Response.json(
        {
          worker: 'psynova-modular-spine-api',
          escaleta: 'psynova-cursor-escaleta-v1.md',
          routes: [
            'GET /api/health',
            'PUT|GET /api/storage/:key',
            'POST /api/stripe/webhook',
            'GET /api/patients',
            'GET /api/schedules',
            'POST /api/schedules/:id/confirm',
          ],
        },
        { status: 404 },
      );
    } catch (err) {
      return Response.json(
        {
          error: 'unhandled',
          message: err instanceof Error ? err.message : String(err),
        },
        { status: 500 },
      );
    }
  },
};
