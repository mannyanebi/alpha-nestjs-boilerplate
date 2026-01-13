import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { RoleType } from './constants/roles.constant.ts';
import { PermissionEntity } from './entities/permission.entity.ts';
import { RoleEntity } from './entities/role.entity.ts';

interface IPermissionCheckOptions {
  enforceOwnership?: boolean;
  resourceOwnerId?: string;
  currentUserId?: string;
}

@Injectable()
export class RbacService {
  // In-memory cache for role permissions (5 minutes TTL)
  private readonly permissionsCache = new Map<
    string,
    { permissions: string[]; timestamp: number }
  >();

  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  /**
   * Get all permissions for a role (with caching)
   */
  async getRolePermissions(roleName: RoleType): Promise<string[]> {
    const cacheKey = `role:${roleName}`;
    const cached = this.permissionsCache.get(cacheKey);

    // Check cache validity
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.permissions;
    }

    // Query database
    const role = await this.roleRepository.findOne({
      where: { name: roleName, isActive: true },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      return [];
    }

    const permissions = role.rolePermissions
      .filter((rp) => rp.permission.isActive)
      .map((rp) => rp.permission.slug);

    // Cache the result
    this.permissionsCache.set(cacheKey, {
      permissions,
      timestamp: Date.now(),
    });

    return permissions;
  }

  /**
   * Check if a role has a specific permission
   * Supports wildcard matching
   */
  async hasPermission(
    roleName: RoleType,
    requiredPermission: string,
    options?: IPermissionCheckOptions,
  ): Promise<boolean> {
    const permissions = await this.getRolePermissions(roleName);

    // Check for god mode
    if (permissions.includes('*')) {
      return true;
    }

    // Check for exact match
    if (permissions.includes(requiredPermission)) {
      // If ownership is required, verify it
      if (options?.enforceOwnership && requiredPermission.includes('.own')) {
        return this.checkOwnership(options);
      }

      return true;
    }

    // Check for wildcard match
    // Example: user has 'readings.*', checking for 'readings.view.own'
    const resource = requiredPermission.split('.')[0];
    const wildcardPermission = `${resource}.*`;

    if (permissions.includes(wildcardPermission)) {
      if (options?.enforceOwnership && requiredPermission.includes('.own')) {
        return this.checkOwnership(options);
      }

      return true;
    }

    return false;
  }

  /**
   * Check if user has any of the required permissions
   */
  async hasAnyPermission(
    roleName: RoleType,
    requiredPermissions: string[],
    options?: IPermissionCheckOptions,
  ): Promise<boolean> {
    const checks = requiredPermissions.map((permission) =>
      this.hasPermission(roleName, permission, options),
    );
    const results = await Promise.all(checks);

    return results.some(Boolean);
  }

  /**
   * Check if user has all required permissions
   */
  async hasAllPermissions(
    roleName: RoleType,
    requiredPermissions: string[],
    options?: IPermissionCheckOptions,
  ): Promise<boolean> {
    const checks = requiredPermissions.map((permission) =>
      this.hasPermission(roleName, permission, options),
    );
    const results = await Promise.all(checks);

    return results.every(Boolean);
  }

  /**
   * Check ownership for .own permissions
   */
  private checkOwnership(options: IPermissionCheckOptions): boolean {
    if (!options.resourceOwnerId || !options.currentUserId) {
      return false;
    }

    return options.resourceOwnerId === options.currentUserId;
  }

  /**
   * Clear cache for a specific role or all roles
   */
  clearCache(roleName?: RoleType): void {
    if (roleName) {
      this.permissionsCache.delete(`role:${roleName}`);
    } else {
      this.permissionsCache.clear();
    }
  }

  /**
   * Get permission details by slug
   */
  async getPermission(slug: string): Promise<PermissionEntity | null> {
    return this.permissionRepository.findOne({
      where: { slug, isActive: true },
    });
  }

  /**
   * Get role details by name
   */
  async getRole(name: RoleType): Promise<RoleEntity | null> {
    return this.roleRepository.findOne({
      where: { name, isActive: true },
    });
  }

  /**
   * Get all active roles
   */
  async getAllRoles(): Promise<RoleEntity[]> {
    return this.roleRepository.find({
      where: { isActive: true },
      order: { hierarchy: 'ASC' },
    });
  }

  /**
   * Get all active permissions
   */
  async getAllPermissions(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({
      where: { isActive: true },
      order: { resource: 'ASC', action: 'ASC' },
    });
  }
}
