import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { AuditLogService } from '../audit-log.service.ts';
import type { IAuditLogOptions } from '../decorators/audit-log.decorator.ts';
import { AUDIT_LOG_KEY } from '../decorators/audit-log.decorator.ts';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditConfig = this.reflector.get<IAuditLogOptions>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<{
      user?: { id: string };
      ip?: string;
      headers: Record<string, string>;
      body?: Record<string, unknown>;
      params?: Record<string, string>;
      query?: Record<string, string>;
    }>();
    const { user, ip, headers, body, params, query } = request;

    // Extract entity ID from params/query/body
    const entityId = this.extractEntityId(auditConfig, params, query, body);

    const baseLogData = {
      userId: user?.id ?? null,
      action: auditConfig.action,
      entityType: auditConfig.entityType,
      entityId,
      ipAddress: ip ?? headers['x-forwarded-for'] ?? headers['x-real-ip'],
      userAgent: headers['user-agent'],
      source: headers['x-client-type'] ?? 'web',
      updatedValues: auditConfig.captureBody ? this.sanitizeBody(body) : null,
    };

    return next.handle().pipe(
      tap((response) => {
        // Success case
        void this.auditLogService.create({
          ...baseLogData,
          status: 'success',
          metadata: auditConfig.message
            ? {
                message: auditConfig.message,
                response: this.sanitizeResponse(response),
              }
            : { response: this.sanitizeResponse(response) },
        });
      }),
      catchError((error: Error) => {
        // Error case - still log the attempt
        void this.auditLogService.create({
          ...baseLogData,
          status: 'failed',
          errorMessage: error.message,
          metadata: { stack: error.stack },
        });

        throw error;
      }),
    );
  }

  private extractEntityId(
    config: IAuditLogOptions,
    params?: Record<string, string>,
    query?: Record<string, string>,
    body?: Record<string, unknown>,
  ): string {
    const paramKey = config.entityIdParam ?? 'id';

    // Use OR operator to handle empty string as falsy
    return (
      params?.[paramKey] ??
      query?.[paramKey] ??
      (body?.[paramKey] as string | undefined) ??
      'unknown'
    );
  }

  private sanitizeBody(
    body?: Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const sanitized = { ...body };

    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.currentPassword;
    delete sanitized.newPassword;
    delete sanitized.confirmPassword;
    delete sanitized.token;
    delete sanitized.refreshToken;
    delete sanitized.accessToken;

    return sanitized;
  }

  private sanitizeResponse(response: unknown): unknown {
    if (!response || typeof response !== 'object') {
      return response;
    }

    // Limit response size in metadata to avoid bloat
    if (Array.isArray(response) && response.length > 10) {
      return { count: response.length, sample: response.slice(0, 3) };
    }

    const sanitized = { ...(response as Record<string, unknown>) };

    // Remove sensitive data if needed
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.refreshToken;
    delete sanitized.accessToken;

    return sanitized;
  }
}
