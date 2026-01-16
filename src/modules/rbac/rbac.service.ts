import { CACHE_MANAGER, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { In, Repository } from 'typeorm';

import { UserEntity } from '../user/user.entity.ts';
import {
  isWildcardPermission,
  requiresOwnership,
} from './constants/permissions.constant.ts';
import type { RoleType } from './constants/roles.constant.ts';
import type { AssignPermissionsDto } from './dtos/assign-permissions.dto.ts';
import type { CreatePermissionDto } from './dtos/create-permission.dto.ts';
import type { CreateRoleDto } from './dtos/create-role.dto.ts';
import { RoleDetailsDto } from './dtos/role-details.dto.ts';
import { RoleSummaryDto } from './dtos/role-summary.dto.ts';
import type { UpdatePermissionDto } from './dtos/update-permission.dto.ts';
import type { UpdateRoleDto } from './dtos/update-role.dto.ts';
import { PermissionEntity } from './entities/permission.entity.ts';
import { RoleEntity } from './entities/role.entity.ts';
import { RolePermissionEntity } from './entities/role-permission.entity.ts';
import { PermissionNotFoundException } from './exceptions/permission-not-found.exception.ts';
import { RoleNotFoundException } from './exceptions/role-not-found.exception.ts';

interface IPermissionCheckOptions {
  enforceOwnership?: boolean;
  resourceOwnerId?: string;
  currentUserId?: string;
}

@Injectable()
export class RbacService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepository: Repository<RolePermissionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Get all permissions for a role (with caching)
   */
  async getRolePermissions(roleName: RoleType | string): Promise<string[]> {
    const cacheKey = `role:${roleName}`;
    const cached = await this.cacheManager.get<string[]>(cacheKey);

    // Check cache validity
    if (cached) {
      return cached;
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
    await this.cacheManager.set<string[]>(cacheKey, permissions);

    return permissions;
  }

  /**
   * Check if a role has a specific permission
   * Supports wildcard matching
   */
  async hasPermission(
    roleName: RoleType | string,
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
    roleName: RoleType | string,
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
    roleName: RoleType | string,
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
  async clearCache(roleName?: RoleType | string): Promise<void> {
    if (roleName) {
      await this.cacheManager.del(`role:${roleName}`);
    } else {
      await this.cacheManager.clear();
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

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionEntity> {
    const existingPermission = await this.permissionRepository.findOne({
      where: { slug: createPermissionDto.slug },
    });

    if (existingPermission) {
      throw new ConflictException('error.permissionAlreadyExists');
    }

    const { resource, action } = this.resolvePermissionParts(
      createPermissionDto.slug,
    );

    const permission = this.permissionRepository.create({
      slug: createPermissionDto.slug,
      resource,
      action,
      description: createPermissionDto.description ?? null,
      requiresOwnership: requiresOwnership(createPermissionDto.slug),
      isWildcard: isWildcardPermission(createPermissionDto.slug),
      isActive: createPermissionDto.isActive ?? true,
    });

    const savedPermission = await this.permissionRepository.save(permission);
    await this.clearCache();

    return savedPermission;
  }

  async getPermissions(): Promise<PermissionEntity[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async getPermissionDetails(permissionId: Uuid): Promise<PermissionEntity> {
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    return permission;
  }

  async updatePermission(
    permissionId: Uuid,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionEntity> {
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    if (
      updatePermissionDto.slug &&
      updatePermissionDto.slug !== permission.slug
    ) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { slug: updatePermissionDto.slug },
      });

      if (existingPermission) {
        throw new ConflictException('error.permissionAlreadyExists');
      }
    }

    const updates: Partial<PermissionEntity> = {};

    if (updatePermissionDto.slug !== undefined) {
      updates.slug = updatePermissionDto.slug;
      const { resource, action } = this.resolvePermissionParts(
        updatePermissionDto.slug,
      );
      updates.resource = resource;
      updates.action = action;
      updates.requiresOwnership = requiresOwnership(updatePermissionDto.slug);
      updates.isWildcard = isWildcardPermission(updatePermissionDto.slug);
    }

    if (updatePermissionDto.description !== undefined) {
      updates.description = updatePermissionDto.description;
    }

    if (updatePermissionDto.isActive !== undefined) {
      updates.isActive = updatePermissionDto.isActive;
    }

    this.permissionRepository.merge(permission, updates);

    const savedPermission = await this.permissionRepository.save(permission);
    await this.clearCache();

    return savedPermission;
  }

  async deletePermission(permissionId: Uuid): Promise<void> {
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    await this.permissionRepository.remove(permission);
    await this.clearCache();
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<RoleDetailsDto> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('error.roleAlreadyExists');
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      displayName: createRoleDto.displayName ?? createRoleDto.name,
      description: createRoleDto.description ?? null,
      hierarchy: createRoleDto.hierarchy ?? 1,
      isActive: createRoleDto.isActive ?? true,
    });

    const savedRole = await this.roleRepository.save(role);

    if (createRoleDto.permissions?.length) {
      await this.attachPermissionsToRole(savedRole, createRoleDto.permissions);
    }

    return this.getRoleDetails(savedRole.id);
  }

  // @CacheTTL(600000) // 10 minutes
  // @CacheKey('rbac_service_get_roles')
  async getRoles(): Promise<RoleEntity[]> {
    // 🔍 Debug: Check what cache store is being used
    console.log('🔍 Cache manager store:', this.cacheManager.stores);

    const roles = await this.roleRepository.find({
      order: { hierarchy: 'ASC' },
    });

    const testKey = 'test_cache_key';
    await this.cacheManager.set(testKey, { hello: 'world' }, 60);
    const testValue = await this.cacheManager.get(testKey);
    console.log('🧪 Test cache value:', testValue);

    return roles;
  }

  async getRolesSummary(): Promise<RoleSummaryDto[]> {
    const roles = await this.roleRepository.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { hierarchy: 'ASC' },
    });

    const counts = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany<{ role: string; count: string }>();

    const countMap = new Map(
      counts.map((row) => [row.role, Number.parseInt(row.count, 10)]),
    );

    return roles.map((role) => {
      const permissions =
        role.rolePermissions
          ?.filter((rp) => rp.permission.isActive)
          .map((rp) => rp.permission.slug) ?? [];

      return new RoleSummaryDto(
        role,
        permissions,
        countMap.get(role.name) ?? 0,
      );
    });
  }

  async getRoleDetails(roleId: Uuid): Promise<RoleDetailsDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new RoleNotFoundException();
    }

    const permissions = role.rolePermissions
      .filter((rp) => rp.permission.isActive)
      .map((rp) => rp.permission.slug);

    return new RoleDetailsDto(role, permissions);
  }

  async updateRole(
    roleId: Uuid,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleDetailsDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new RoleNotFoundException();
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException('error.roleAlreadyExists');
      }
    }

    const updates: Partial<RoleEntity> = {};

    if (updateRoleDto.name !== undefined) {
      updates.name = updateRoleDto.name;
    }

    if (updateRoleDto.displayName !== undefined) {
      updates.displayName = updateRoleDto.displayName;
    }

    if (updateRoleDto.description !== undefined) {
      updates.description = updateRoleDto.description;
    }

    if (updateRoleDto.hierarchy !== undefined) {
      updates.hierarchy = updateRoleDto.hierarchy;
    }

    if (updateRoleDto.isActive !== undefined) {
      updates.isActive = updateRoleDto.isActive;
    }

    this.roleRepository.merge(role, updates);

    await this.roleRepository.save(role);
    await this.clearCache(role.name);

    return this.getRoleDetails(role.id);
  }

  async deleteRole(roleId: Uuid): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new RoleNotFoundException();
    }

    await this.roleRepository.remove(role);
    await this.clearCache(role.name);
  }

  async assignPermissions(
    roleId: Uuid,
    assignPermissionsDto: AssignPermissionsDto,
  ): Promise<RoleDetailsDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new RoleNotFoundException();
    }

    const permissions = await this.resolvePermissions(
      assignPermissionsDto.permissions,
    );

    const existingPermissionIds = new Set(
      role.rolePermissions.map((rp) => rp.permissionId),
    );

    const mappings = permissions
      .filter((permission) => !existingPermissionIds.has(permission.id))
      .map((permission) =>
        this.rolePermissionRepository.create({
          roleId: role.id,
          permissionId: permission.id,
        }),
      );

    if (mappings.length) {
      await this.rolePermissionRepository.save(mappings);
    }

    await this.clearCache(role.name);

    return this.getRoleDetails(role.id);
  }

  async removePermission(
    roleId: Uuid,
    permissionId: Uuid,
  ): Promise<RoleDetailsDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new RoleNotFoundException();
    }

    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      throw new PermissionNotFoundException();
    }

    await this.rolePermissionRepository.remove(rolePermission);
    await this.clearCache(role.name);

    return this.getRoleDetails(role.id);
  }

  private async attachPermissionsToRole(
    role: RoleEntity,
    permissions: string[],
  ): Promise<void> {
    const resolvedPermissions = await this.resolvePermissions(permissions);

    const mappings = resolvedPermissions.map((permission) =>
      this.rolePermissionRepository.create({
        roleId: role.id,
        permissionId: permission.id,
      }),
    );

    if (mappings.length) {
      await this.rolePermissionRepository.save(mappings);
    }
  }

  private async resolvePermissions(
    permissions: string[],
  ): Promise<PermissionEntity[]> {
    const uniquePermissions = Array.from(new Set(permissions));

    if (!uniquePermissions.length) {
      return [];
    }

    const resolvedPermissions = await this.permissionRepository.find({
      where: {
        slug: In(uniquePermissions),
        isActive: true,
      },
    });

    if (resolvedPermissions.length !== uniquePermissions.length) {
      const found = new Set(
        resolvedPermissions.map((permission) => permission.slug),
      );
      const missing = uniquePermissions.filter(
        (permission) => !found.has(permission),
      );
      throw new PermissionNotFoundException(missing.join(', '));
    }

    return resolvedPermissions;
  }

  private resolvePermissionParts(slug: string): {
    resource: string;
    action: string;
  } {
    const [resource, ...actionParts] = slug.split('.');
    const action = actionParts.join('.');

    return {
      resource: resource === '*' ? 'all' : resource,
      action: action || 'all',
    };
  }
}
