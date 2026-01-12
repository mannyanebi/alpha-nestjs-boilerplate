import type { DataSource } from 'typeorm';

import { Permission } from '../constants/permissions.constant.ts';
import {
  ROLE_DESCRIPTIONS,
  ROLE_HIERARCHY,
  RoleType,
} from '../constants/roles.constant.ts';
import { PermissionEntity } from '../entities/permission.entity.ts';
import { RolePermissionEntity } from '../entities/role-permission.entity.ts';
import { RoleEntity } from '../entities/role.entity.ts';

/**
 * Permission Matrix - Defines which permissions each role has
 * Based on additive inheritance model
 */
const ROLE_PERMISSIONS_MATRIX: Record<RoleType, Permission[]> = {
  [RoleType.AGRONOMIST]: [
    // Master Data
    Permission.MASTER_DATA_VIEW,
    // Fields
    Permission.FIELDS_VIEW,
    // Trials
    Permission.TRIALS_VIEW,
    Permission.TRIALS_ASSIGNMENTS_VIEW,
    // Readings
    Permission.READINGS_CREATE,
    Permission.READINGS_VIEW_OWN,
    Permission.READINGS_EDIT_OWN,
    // Analytics
    Permission.ANALYTICS_VIEW_BASIC,
  ],

  [RoleType.SENIOR_AGRONOMIST]: [
    // Inherits all from Agronomist
    Permission.MASTER_DATA_VIEW,
    Permission.FIELDS_VIEW,
    Permission.TRIALS_VIEW,
    Permission.TRIALS_ASSIGNMENTS_VIEW,
    Permission.READINGS_CREATE,
    Permission.READINGS_VIEW_OWN,
    Permission.READINGS_EDIT_OWN,
    Permission.ANALYTICS_VIEW_BASIC,
    // Additional permissions
    Permission.USERS_VIEW,
    Permission.USERS_CREATE_STAFF,
    Permission.USERS_MANAGE_STAFF,
    Permission.FIELDS_CREATE,
    Permission.FIELDS_EDIT,
    Permission.TRIALS_CREATE,
    Permission.TRIALS_EDIT,
    Permission.TRIALS_ARCHIVE,
    Permission.TRIALS_ASSIGNMENTS_CREATE,
    Permission.TRIALS_ASSIGNMENTS_REVOKE,
    Permission.READINGS_VIEW_ALL,
    Permission.READINGS_EDIT_ALL,
    Permission.READINGS_APPROVE,
    Permission.READINGS_REJECT,
    Permission.SYSTEM_CONFIG,
  ],

  [RoleType.MEAL]: [
    // Inherits all from Senior Agronomist
    Permission.MASTER_DATA_VIEW,
    Permission.FIELDS_VIEW,
    Permission.TRIALS_VIEW,
    Permission.TRIALS_ASSIGNMENTS_VIEW,
    Permission.READINGS_CREATE,
    Permission.READINGS_VIEW_OWN,
    Permission.READINGS_EDIT_OWN,
    Permission.ANALYTICS_VIEW_BASIC,
    Permission.USERS_VIEW,
    Permission.USERS_CREATE_STAFF,
    Permission.USERS_MANAGE_STAFF,
    Permission.FIELDS_CREATE,
    Permission.FIELDS_EDIT,
    Permission.TRIALS_CREATE,
    Permission.TRIALS_EDIT,
    Permission.TRIALS_ARCHIVE,
    Permission.TRIALS_ASSIGNMENTS_CREATE,
    Permission.TRIALS_ASSIGNMENTS_REVOKE,
    Permission.READINGS_VIEW_ALL,
    Permission.READINGS_EDIT_ALL,
    Permission.READINGS_APPROVE,
    Permission.READINGS_REJECT,
    Permission.SYSTEM_CONFIG,
    // Additional MEAL permissions
    Permission.ANALYTICS_VIEW_ADVANCED,
    Permission.ANALYTICS_EXPORT,
    Permission.ANALYTICS_MODELS,
    Permission.SYSTEM_LOGS_VIEW,
  ],

  [RoleType.SUPER_ADMIN]: [
    // God mode - has everything via wildcard
    Permission.ALL,
    Permission.USERS_ALL,
    Permission.MASTER_DATA_ALL,
    Permission.FIELDS_ALL,
    Permission.TRIALS_ALL,
    Permission.READINGS_ALL,
    Permission.ANALYTICS_ALL,
    Permission.SYSTEM_ALL,
    // Explicit permissions for completeness
    Permission.USERS_CREATE_ADMIN,
    Permission.USERS_MANAGE_ADMIN,
    Permission.USERS_ASSIGN_ROLES,
    Permission.MASTER_DATA_CREATE,
    Permission.MASTER_DATA_EDIT,
    Permission.MASTER_DATA_DELETE,
    Permission.FIELDS_DELETE,
    Permission.TRIALS_REOPEN,
    Permission.TRIALS_DELETE,
    Permission.READINGS_OVERRIDE,
    Permission.SYSTEM_BACKUP,
    Permission.SYSTEM_INTEGRATIONS,
  ],
};

/**
 * Seed RBAC data (roles, permissions, and their relationships)
 */
export async function seedRbacData(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(RoleEntity);
  const permissionRepository = dataSource.getRepository(PermissionEntity);
  const rolePermissionRepository =
    dataSource.getRepository(RolePermissionEntity);

  console.log('🌱 Seeding RBAC data...');

  // 1. Create all permissions
  console.log('📝 Creating permissions...');
  const permissionsToCreate = Object.values(Permission).map((slug) => {
    const [resource, ...actionParts] = slug.split('.');
    const action = actionParts.join('.');

    return permissionRepository.create({
      slug,
      resource: resource === '*' ? 'all' : resource,
      action: action || 'all',
      description: getPermissionDescription(slug),
      requiresOwnership: slug.includes('.own'),
      isWildcard: slug.endsWith('.*') || slug === '*',
      isActive: true,
    });
  });

  const createdPermissions = await permissionRepository.save(
    permissionsToCreate,
  );
  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // Create permission map for quick lookup
  const permissionMap = new Map<string, PermissionEntity>();

  for (const permission of createdPermissions) {
    permissionMap.set(permission.slug, permission);
  }

  // 2. Create all roles
  console.log('👥 Creating roles...');
  const rolesToCreate = Object.values(RoleType).map((roleType) =>
    roleRepository.create({
      name: roleType,
      displayName: formatRoleName(roleType),
      description: ROLE_DESCRIPTIONS[roleType],
      hierarchy: ROLE_HIERARCHY[roleType],
      isActive: true,
    }),
  );

  const createdRoles = await roleRepository.save(rolesToCreate);
  console.log(`✅ Created ${createdRoles.length} roles`);

  // Create role map for quick lookup
  const roleMap = new Map<RoleType, RoleEntity>();

  for (const role of createdRoles) {
    roleMap.set(role.name as RoleType, role);
  }

  // 3. Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...');
  const rolePermissionsToCreate: RolePermissionEntity[] = [];

  for (const [roleType, permissions] of Object.entries(
    ROLE_PERMISSIONS_MATRIX,
  )) {
    const role = roleMap.get(roleType as RoleType);

    if (!role) {
      continue;
    }

    for (const permissionSlug of permissions) {
      const permission = permissionMap.get(permissionSlug);

      if (!permission) {
        console.warn(`⚠️  Permission not found: ${permissionSlug}`);
        continue;
      }

      rolePermissionsToCreate.push(
        rolePermissionRepository.create({
          roleId: role.id,
          permissionId: permission.id,
        }),
      );
    }
  }

  await rolePermissionRepository.save(rolePermissionsToCreate);
  console.log(
    `✅ Created ${rolePermissionsToCreate.length} role-permission mappings`,
  );

  // 4. Summary
  console.log('\n📊 RBAC Seeding Summary:');
  console.log('─'.repeat(50));

  for (const roleType of Object.values(RoleType)) {
    const permissions = ROLE_PERMISSIONS_MATRIX[roleType];
    console.log(
      `${formatRoleName(roleType)}: ${permissions.length} permissions`,
    );
  }

  console.log('─'.repeat(50));
  console.log('✨ RBAC data seeded successfully!\n');
}

/**
 * Helper to format role name for display
 */
function formatRoleName(roleType: string): string {
  return roleType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Helper to get permission description
 */
function getPermissionDescription(slug: string): string {
  // Try to find in PERMISSION_DESCRIPTIONS
  const descriptions: Record<string, string> = {
    [Permission.USERS_VIEW]: 'View user profiles and directory',
    [Permission.USERS_CREATE_STAFF]: 'Create new Agronomist accounts',
    [Permission.USERS_MANAGE_STAFF]: 'Edit/Deactivate Agronomist accounts',
    [Permission.USERS_CREATE_ADMIN]:
      'Create Senior Agronomist, MEAL, or Super Admin accounts',
    [Permission.USERS_MANAGE_ADMIN]:
      'Edit/Deactivate Senior Agronomist or MEAL accounts',
    [Permission.USERS_ASSIGN_ROLES]: "Assign or change a user's role",
    [Permission.MASTER_DATA_VIEW]: 'View crops, varieties, and locations',
    [Permission.MASTER_DATA_CREATE]: 'Create new master data entries',
    [Permission.MASTER_DATA_EDIT]: 'Edit existing master data',
    [Permission.MASTER_DATA_DELETE]: 'Delete master data entries',
    [Permission.FIELDS_VIEW]: 'View field details and boundaries',
    [Permission.FIELDS_CREATE]: 'Create new field entities',
    [Permission.FIELDS_EDIT]: 'Edit field definitions',
    [Permission.FIELDS_DELETE]: 'Delete field entities',
    [Permission.TRIALS_VIEW]: 'View active trial setups and mappings',
    [Permission.TRIALS_CREATE]: 'Create new trials',
    [Permission.TRIALS_EDIT]: 'Modify trial parameters',
    [Permission.TRIALS_ARCHIVE]: 'Archive completed trials',
    [Permission.TRIALS_REOPEN]: 'Reopen archived trials',
    [Permission.TRIALS_DELETE]: 'Delete trials permanently',
    [Permission.TRIALS_ASSIGNMENTS_VIEW]: 'View trial assignments',
    [Permission.TRIALS_ASSIGNMENTS_CREATE]: 'Assign agronomists to trials',
    [Permission.TRIALS_ASSIGNMENTS_REVOKE]: 'Remove trial assignments',
    [Permission.READINGS_CREATE]: 'Capture and submit new data',
    [Permission.READINGS_VIEW_OWN]: 'View own submitted data',
    [Permission.READINGS_VIEW_ALL]: 'View all submitted data',
    [Permission.READINGS_EDIT_OWN]: 'Edit own data entries',
    [Permission.READINGS_EDIT_ALL]: 'Edit any data entries',
    [Permission.READINGS_APPROVE]: 'Validate and approve readings',
    [Permission.READINGS_REJECT]: 'Reject readings for review',
    [Permission.READINGS_OVERRIDE]: 'Force override of locked/approved data',
    [Permission.ANALYTICS_VIEW_BASIC]: 'View standard dashboards',
    [Permission.ANALYTICS_VIEW_ADVANCED]: 'View advanced cross-trial analytics',
    [Permission.ANALYTICS_EXPORT]: 'Export raw datasets',
    [Permission.ANALYTICS_MODELS]: 'Run statistical models (ANOVA, GxE)',
    [Permission.SYSTEM_CONFIG]: 'Configure global settings',
    [Permission.SYSTEM_LOGS_VIEW]: 'View audit logs',
    [Permission.SYSTEM_BACKUP]: 'Backup and restore system',
    [Permission.SYSTEM_INTEGRATIONS]: 'Manage external integrations',
    [Permission.ALL]: 'All permissions (Super Admin only)',
  };

  return descriptions[slug] || `Permission: ${slug}`;
}
