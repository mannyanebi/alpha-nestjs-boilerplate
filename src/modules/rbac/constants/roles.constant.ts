export enum RoleType {
  AGRONOMIST = 'agronomist',
  SENIOR_AGRONOMIST = 'senior_agronomist',
  MEAL = 'meal',
  SUPER_ADMIN = 'super_admin',
}

export const ROLE_HIERARCHY: Record<RoleType, number> = {
  [RoleType.AGRONOMIST]: 1,
  [RoleType.SENIOR_AGRONOMIST]: 2,
  [RoleType.MEAL]: 3,
  [RoleType.SUPER_ADMIN]: 4,
};

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  [RoleType.AGRONOMIST]:
    'Field agronomist - captures data and views own readings',
  [RoleType.SENIOR_AGRONOMIST]:
    'Senior agronomist - manages staff, creates trials, validates data',
  [RoleType.MEAL]:
    'Monitoring, Evaluation, Accountability & Learning - advanced analytics and reporting',
  [RoleType.SUPER_ADMIN]:
    'System administrator - full control over all resources',
};
