import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import type { RoleEntity } from '../entities/role.entity.ts';

export class RoleDto extends AbstractDto {
  name: string;

  displayName: string;

  description: string | null;

  hierarchy: number;

  isActive: boolean;

  constructor(role: RoleEntity) {
    super(role);
    this.name = role.name;
    this.displayName = role.displayName;
    this.description = role.description;
    this.hierarchy = role.hierarchy;
    this.isActive = role.isActive;
  }
}
