import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogService } from './activity-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, params } = request;

    // Only intercept mutations (POST, PUT, DELETE, PATCH)
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    if (!isMutation) {
      return next.handle();
    }

    // Exclude security sensitive operations
    if (url.includes('/auth/') || url.includes('/login') || url.includes('/signup')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const userId = user?.sub || user?.id;
          if (!userId) return;

          // Parse table name and action
          const pathSegments = url.split('?')[0].split('/').filter(Boolean);
          const apiIndex = pathSegments.indexOf('api');
          const resource = apiIndex !== -1 && pathSegments[apiIndex + 1]
            ? pathSegments[apiIndex + 1]
            : pathSegments[0] || 'system';

          // Convert resource (e.g. holiday-class -> HolidayClass)
          const targetTable = resource
            .replace(/-./g, (x) => x[1].toUpperCase())
            .replace(/^[a-z]/, (val) => val.toUpperCase());

          let action = '';
          switch (method) {
            case 'POST':
              action = 'CREATE';
              break;
            case 'PUT':
            case 'PATCH':
              action = 'UPDATE';
              break;
            case 'DELETE':
              action = 'DELETE';
              break;
            default:
              action = method;
          }

          const targetId = params?.id || pathSegments[apiIndex + 2] || data?.id || null;

          const cleanBody = { ...body };
          if (cleanBody.password) delete cleanBody.password;
          if (cleanBody.token) delete cleanBody.token;

          const details = JSON.stringify({
            url,
            body: cleanBody,
            responseId: data?.id || null,
          });

          this.activityLogService.log(userId, action, targetTable, targetId, details).catch((err) => {
            console.error('Failed to write audit log:', err);
          });
        },
      }),
    );
  }
}
