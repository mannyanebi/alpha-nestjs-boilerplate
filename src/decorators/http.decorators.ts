import type { PipeTransform } from '@nestjs/common';
import {
  applyDecorators,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Type } from '@nestjs/common/interfaces';
import {
  ApiBearerAuth,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthGuard } from '../guards/auth.guard.ts';
import { PermissionsGuard } from '../guards/permissions.guard.ts';
import { AuthUserInterceptor } from '../interceptors/auth-user-interceptor.service.ts';
import { PublicRoute } from './public-route.decorator.ts';
import type { PermissionString } from './require-permissions.decorator.ts';
import { RequirePermissions } from './require-permissions.decorator.ts';

export function Auth(
  permissions?: PermissionString | PermissionString[],
  options?: Partial<{ public: boolean }>,
): MethodDecorator {
  const isPublicRoute = options?.public;

  if (isPublicRoute && permissions) {
    throw new Error(
      'A route cannot be both public and require authentication/authorization.',
    );
  }

  if (permissions) {
    return applyDecorators(
      RequirePermissions(permissions),
      UseGuards(AuthGuard({ public: isPublicRoute }), PermissionsGuard),
      ApiBearerAuth(),
      UseInterceptors(AuthUserInterceptor),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    );
  }

  if (isPublicRoute) {
    return applyDecorators(PublicRoute(true));
  }

  return applyDecorators(
    UseGuards(AuthGuard({ public: isPublicRoute }), PermissionsGuard), // ✅ Uncommented and use PermissionsGuard
    ApiBearerAuth(),
    UseInterceptors(AuthUserInterceptor),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    PublicRoute(isPublicRoute),
  );
}

export function UUIDParam(
  property: string,
  ...pipes: Array<Type<PipeTransform> | PipeTransform>
): ParameterDecorator {
  return Param(property, new ParseUUIDPipe({ version: '4' }), ...pipes);
}

export function ApiUUIDParam(property: string): MethodDecorator {
  return ApiParam({
    name: property,
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: `${property} (UUID v4)`,
  });
}
