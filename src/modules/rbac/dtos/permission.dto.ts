import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import type { PermissionEntity } from '../entities/permission.entity.ts';

export class PermissionDto extends AbstractDto {
  slug: string;

  resource: string;

  action: string;

  description: string | null;

  requiresOwnership: boolean;

  isWildcard: boolean;

  isActive: boolean;

  constructor(permission: PermissionEntity) {
    super(permission);
    this.slug = permission.slug;
    this.resource = permission.resource;
    this.action = permission.action;
    this.description = permission.description;
    this.requiresOwnership = permission.requiresOwnership;
    this.isWildcard = permission.isWildcard;
    this.isActive = permission.isActive;
  }
}
