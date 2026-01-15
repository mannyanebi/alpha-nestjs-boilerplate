import { SetMetadata } from '@nestjs/common';

import type { Permission } from '../modules/rbac/constants/permissions.constant';

export interface IRequirePermissionsOptions {
  /**
   * Check if user owns the resource (for .own permissions)
   * Default: true for .own permissions, false otherwise
   */
  enforceOwnership?: boolean;

  /**
   * Automatically scope queries to current user (for list endpoints)
   * Default: false
   */
  autoScope?: boolean;

  /**
   * Require ALL permissions (AND logic)
   * Default: false (uses OR logic)
   */
  requireAll?: boolean;
}

export interface IPermissionMetadata {
  permissions: string[];
  options: IRequirePermissionsOptions;
}

export const PERMISSIONS_KEY = 'permissions';

export type PermissionString = `${Permission}`;

/**
 * Decorator to require specific permissions for accessing a route
 *
 * @example
 * // Single permission
 * @RequirePermissions('readings.approve')
 *
 * // Multiple permissions (OR logic)
 * @RequirePermissions(['readings.approve', 'readings.reject'])
 *
 * // Multiple permissions (AND logic)
 * @RequirePermissions(['readings.approve', 'readings.reject'], { requireAll: true })
 *
 * // With ownership enforcement
 * @RequirePermissions('readings.view.own', { enforceOwnership: true })
 *
 * // With auto-scoping for list endpoints
 * @RequirePermissions('readings.view.own', { autoScope: true })
 */
export function RequirePermissions(
  permissions: PermissionString | PermissionString[],
  options: IRequirePermissionsOptions = {},
): MethodDecorator {
  const permissionArray = Array.isArray(permissions)
    ? permissions
    : [permissions];

  const metadata: IPermissionMetadata = {
    permissions: permissionArray,
    options: {
      enforceOwnership: options.enforceOwnership ?? undefined,
      autoScope: options.autoScope ?? false,
      requireAll: options.requireAll ?? false,
    },
  };

  return SetMetadata(PERMISSIONS_KEY, metadata);
}
