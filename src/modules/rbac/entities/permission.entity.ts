import { Column, Entity, Index, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { PermissionDto } from '../dtos/permission.dto.ts';
import { RolePermissionEntity } from './role-permission.entity.ts';

@Entity('permissions')
@UseDto(PermissionDto)
export class PermissionEntity extends AbstractEntity<PermissionDto> {
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  slug!: string; // e.g., 'readings.view.own'

  @Column({ type: 'varchar', length: 50 })
  @Index()
  resource!: string; // e.g., 'readings'

  @Column({ type: 'varchar', length: 50 })
  action!: string; // e.g., 'view.own'

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: false })
  requiresOwnership!: boolean; // true for .own permissions

  @Column({ type: 'boolean', default: false })
  isWildcard!: boolean; // true for .* permissions

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(
    () => RolePermissionEntity,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions!: RolePermissionEntity[];
}
