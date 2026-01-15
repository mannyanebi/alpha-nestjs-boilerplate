import type { RoleEntity } from '../entities/role.entity.ts';
import { RoleDto } from './role.dto.ts';

export class RoleDetailsDto extends RoleDto {
  permissions: string[];

  constructor(role: RoleEntity, permissions: string[]) {
    super(role);
    this.permissions = permissions;
  }
}
