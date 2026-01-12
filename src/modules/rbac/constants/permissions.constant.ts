/**
 * RBAC Permissions for CROPTERA Platform
 * Following dot notation with additive inheritance
 */

export enum Permission {
  // ============== USERS ==============
  USERS_VIEW = 'users.view',
  USERS_CREATE_STAFF = 'users.create.staff',
  USERS_MANAGE_STAFF = 'users.manage.staff',
  USERS_CREATE_ADMIN = 'users.create.admin',
  USERS_MANAGE_ADMIN = 'users.manage.admin',
  USERS_ASSIGN_ROLES = 'users.assign.roles',
  USERS_ALL = 'users.*',

  // ============== MASTER DATA ==============
  MASTER_DATA_VIEW = 'master_data.view',
  MASTER_DATA_CREATE = 'master_data.create',
  MASTER_DATA_EDIT = 'master_data.edit',
  MASTER_DATA_DELETE = 'master_data.delete',
  MASTER_DATA_ALL = 'master_data.*',

  // ============== FIELDS ==============
  FIELDS_VIEW = 'fields.view',
  FIELDS_CREATE = 'fields.create',
  FIELDS_EDIT = 'fields.edit',
  FIELDS_DELETE = 'fields.delete',
  FIELDS_ALL = 'fields.*',

  // ============== TRIALS ==============
  TRIALS_VIEW = 'trials.view',
  TRIALS_CREATE = 'trials.create',
  TRIALS_EDIT = 'trials.edit',
  TRIALS_ARCHIVE = 'trials.archive',
  TRIALS_REOPEN = 'trials.reopen',
  TRIALS_DELETE = 'trials.delete',
  TRIALS_ASSIGNMENTS_VIEW = 'trials.assignments.view',
  TRIALS_ASSIGNMENTS_CREATE = 'trials.assignments.create',
  TRIALS_ASSIGNMENTS_REVOKE = 'trials.assignments.revoke',
  TRIALS_ALL = 'trials.*',

  // ============== READINGS ==============
  READINGS_CREATE = 'readings.create',
  READINGS_VIEW_OWN = 'readings.view.own',
  READINGS_VIEW_ALL = 'readings.view.all',
  READINGS_EDIT_OWN = 'readings.edit.own',
  READINGS_EDIT_ALL = 'readings.edit.all',
  READINGS_APPROVE = 'readings.approve',
  READINGS_REJECT = 'readings.reject',
  READINGS_OVERRIDE = 'readings.override',
  READINGS_ALL = 'readings.*',

  // ============== ANALYTICS ==============
  ANALYTICS_VIEW_BASIC = 'analytics.view.basic',
  ANALYTICS_VIEW_ADVANCED = 'analytics.view.advanced',
  ANALYTICS_EXPORT = 'analytics.export',
  ANALYTICS_MODELS = 'analytics.models',
  ANALYTICS_ALL = 'analytics.*',

  // ============== SYSTEM ==============
  SYSTEM_CONFIG = 'system.config',
  SYSTEM_LOGS_VIEW = 'system.logs.view',
  SYSTEM_BACKUP = 'system.backup',
  SYSTEM_INTEGRATIONS = 'system.integrations',
  SYSTEM_ALL = 'system.*',

  // ============== GOD MODE ==============
  ALL = '*',
}

/**
 * Permissions that require ownership checking
 * Format: 'resource.action.own'
 */
export const OWNERSHIP_PERMISSIONS = [
  Permission.READINGS_VIEW_OWN,
  Permission.READINGS_EDIT_OWN,
  Permission.TRIALS_ASSIGNMENTS_VIEW, // Agronomists can only view their own assignments
] as const;

/**
 * Wildcard permissions for easy checking
 */
export const WILDCARD_PERMISSIONS = [
  Permission.ALL,
  Permission.USERS_ALL,
  Permission.MASTER_DATA_ALL,
  Permission.FIELDS_ALL,
  Permission.TRIALS_ALL,
  Permission.READINGS_ALL,
  Permission.ANALYTICS_ALL,
  Permission.SYSTEM_ALL,
] as const;

/**
 * Permission descriptions for UI/Documentation
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  // Users
  [Permission.USERS_VIEW]: 'View user profiles and directory',
  [Permission.USERS_CREATE_STAFF]: 'Create new Agronomist accounts',
  [Permission.USERS_MANAGE_STAFF]: 'Edit/Deactivate Agronomist accounts',
  [Permission.USERS_CREATE_ADMIN]:
    'Create Senior Agronomist, MEAL, or Super Admin accounts',
  [Permission.USERS_MANAGE_ADMIN]:
    'Edit/Deactivate Senior Agronomist or MEAL accounts',
  [Permission.USERS_ASSIGN_ROLES]: "Assign or change a user's role",
  [Permission.USERS_ALL]: 'All user management permissions',

  // Master Data
  [Permission.MASTER_DATA_VIEW]: 'View crops, varieties, and locations',
  [Permission.MASTER_DATA_CREATE]: 'Create new master data entries',
  [Permission.MASTER_DATA_EDIT]: 'Edit existing master data',
  [Permission.MASTER_DATA_DELETE]: 'Delete master data entries',
  [Permission.MASTER_DATA_ALL]: 'All master data permissions',

  // Fields
  [Permission.FIELDS_VIEW]: 'View field details and boundaries',
  [Permission.FIELDS_CREATE]: 'Create new field entities',
  [Permission.FIELDS_EDIT]: 'Edit field definitions',
  [Permission.FIELDS_DELETE]: 'Delete field entities',
  [Permission.FIELDS_ALL]: 'All field permissions',

  // Trials
  [Permission.TRIALS_VIEW]: 'View active trial setups and mappings',
  [Permission.TRIALS_CREATE]: 'Create new trials',
  [Permission.TRIALS_EDIT]: 'Modify trial parameters',
  [Permission.TRIALS_ARCHIVE]: 'Archive completed trials',
  [Permission.TRIALS_REOPEN]: 'Reopen archived trials',
  [Permission.TRIALS_DELETE]: 'Delete trials permanently',
  [Permission.TRIALS_ASSIGNMENTS_VIEW]: 'View trial assignments',
  [Permission.TRIALS_ASSIGNMENTS_CREATE]: 'Assign agronomists to trials',
  [Permission.TRIALS_ASSIGNMENTS_REVOKE]: 'Remove trial assignments',
  [Permission.TRIALS_ALL]: 'All trial permissions',

  // Readings
  [Permission.READINGS_CREATE]: 'Capture and submit new data',
  [Permission.READINGS_VIEW_OWN]: 'View own submitted data',
  [Permission.READINGS_VIEW_ALL]: 'View all submitted data',
  [Permission.READINGS_EDIT_OWN]: 'Edit own data entries',
  [Permission.READINGS_EDIT_ALL]: 'Edit any data entries',
  [Permission.READINGS_APPROVE]: 'Validate and approve readings',
  [Permission.READINGS_REJECT]: 'Reject readings for review',
  [Permission.READINGS_OVERRIDE]: 'Force override of locked/approved data',
  [Permission.READINGS_ALL]: 'All reading permissions',

  // Analytics
  [Permission.ANALYTICS_VIEW_BASIC]: 'View standard dashboards',
  [Permission.ANALYTICS_VIEW_ADVANCED]: 'View advanced cross-trial analytics',
  [Permission.ANALYTICS_EXPORT]: 'Export raw datasets',
  [Permission.ANALYTICS_MODELS]: 'Run statistical models (ANOVA, GxE)',
  [Permission.ANALYTICS_ALL]: 'All analytics permissions',

  // System
  [Permission.SYSTEM_CONFIG]: 'Configure global settings',
  [Permission.SYSTEM_LOGS_VIEW]: 'View audit logs',
  [Permission.SYSTEM_BACKUP]: 'Backup and restore system',
  [Permission.SYSTEM_INTEGRATIONS]: 'Manage external integrations',
  [Permission.SYSTEM_ALL]: 'All system permissions',

  // God Mode
  [Permission.ALL]: 'All permissions (Super Admin only)',
};

/**
 * Helper to check if a permission is a wildcard
 */
export function isWildcardPermission(permission: string): boolean {
  return permission.endsWith('.*') || permission === '*';
}

/**
 * Helper to check if a permission requires ownership
 */
export function requiresOwnership(permission: string): boolean {
  return (
    permission.includes('.own') ||
    permission === String(Permission.TRIALS_ASSIGNMENTS_VIEW)
  );
}

/**
 * Helper to get resource from permission
 * Example: 'readings.view.own' -> 'readings'
 */
export function getResourceFromPermission(permission: string): string {
  return permission.split('.')[0] ?? 'unknown';
}
