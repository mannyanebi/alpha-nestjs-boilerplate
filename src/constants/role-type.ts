/**
 * @deprecated Use RoleType from rbac module instead
 * This enum is kept for backward compatibility only
 */
export enum RoleType {
  AGRONOMIST = 'agronomist',
  SENIOR_AGRONOMIST = 'senior_agronomist',
  MEAL = 'meal',
  SUPER_ADMIN = 'super_admin',
  // Legacy values (to be removed)
  USER = 'agronomist', // Maps to AGRONOMIST
  ADMIN = 'super_admin', // Maps to SUPER_ADMIN
}
