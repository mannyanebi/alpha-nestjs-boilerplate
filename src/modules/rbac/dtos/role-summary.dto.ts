import { RoleDto } from './role.dto.ts';
import type { RoleEntity } from '../entities/role.entity.ts';

export class RoleSummaryDto extends RoleDto {
  permissions: string[];
  userCount: number;

  constructor(role: RoleEntity, permissions: string[], userCount: number) {
    super(role);
    this.permissions = permissions;
    this.userCount = userCount;
  }
}
