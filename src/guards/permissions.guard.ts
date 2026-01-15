import type { CanActivate, ExecutionContext } from '@nestjs/common';
import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { IPermissionMetadata } from '../decorators/require-permissions.decorator.ts';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.ts';
import type { RoleType } from '../modules/rbac/constants/roles.constant.ts';
import { RbacService } from '../modules/rbac/rbac.service.ts';
import { ApiConfigService } from '../shared/services/api-config.service.ts';

interface IRequestWithUser extends Request {
  user?: {
    id: string;
    role: RoleType;
    email?: string;
  };
  params?: Record<string, string>;
  query?: Record<string, string>;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
    public configService: ApiConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get permission metadata from decorator
    const IPermissionMetadata = this.reflector.get<IPermissionMetadata>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    // No permissions required, allow access

    if (!IPermissionMetadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest<IRequestWithUser>();
    const user = request.user;

    // User must be authenticated
    if (!user?.role) {
      throw new UnauthorizedException('Authentication required');
    }

    const { permissions, options } = IPermissionMetadata;

    // Check permissions based on requireAll option
    const hasPermission = options.requireAll
      ? await this.rbacService.hasAllPermissions(user.role, permissions)
      : await this.rbacService.hasAnyPermission(user.role, permissions);

    if (!hasPermission) {
      if (this.configService.isDevelopment) {
        this.logger.warn(
          `[PermissionsGuard] User with role "${user.role}" lacks required permissions: ${permissions.join(
            ', ',
          )}`,
        );
      }
      throw new ForbiddenException('Insufficient permissions');
    }

    // Handle ownership enforcement for .own permissions
    if (options.enforceOwnership) {
      await this.enforceOwnership(request, user, permissions);
    }

    // Handle auto-scoping (inject userId filter)
    if (options.autoScope) {
      this.applyAutoScope(request, user);
    }

    return true;
  }

  /**
   * Enforce ownership for .own permissions
   * Throws 403 if user tries to access others' resources
   */
  private async enforceOwnership(
    request: IRequestWithUser,
    user: { id: string; role: RoleType },
    permissions: string[],
  ): Promise<void> {
    // Only enforce for .own permissions
    const hasOwnPermission = permissions.some((p) => p.includes('.own'));

    if (!hasOwnPermission) {
      return;
    }

    // Check if user has the .all version of the permission
    // Example: if checking 'readings.view.own', check for 'readings.view.all'
    const allPermissions = permissions.map((p) => p.replace('.own', '.all'));

    const hasAllPermission = await this.rbacService.hasAnyPermission(
      user.role,
      allPermissions,
    );

    // If user has .all permission, skip ownership check
    if (hasAllPermission) {
      return;
    }

    // TODO: Implement actual ownership verification logic here
    // For ownership check, we need to verify the resource belongs to the user
    // This requires fetching the resource, which we'll do in a service-specific way
    // For now, we'll add a marker to the request that ownership needs verification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).requiresOwnershipCheck = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).ownershipUserId = user.id;
  }

  /**
   * Apply auto-scoping to filter resources by current user
   * Injects userId into query parameters
   */
  private applyAutoScope(
    request: IRequestWithUser,
    user: { id: string },
  ): void {
    // Add userId to query parameters for automatic filtering
    if (!request.query) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any).query = {};
    }

    request.query!.userId = user.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).autoScoped = true;
  }
}
