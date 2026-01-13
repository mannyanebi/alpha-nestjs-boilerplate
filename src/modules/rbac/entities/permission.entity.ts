import { Column, Entity, Index, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { PermissionDto } from '../dtos/permission.dto.ts';
import type { RolePermissionEntity } from './role-permission.entity.ts';

@Entity('permissions')
@UseDto(PermissionDto)
export class PermissionEntity extends AbstractEntity<PermissionDto> {
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  slug!: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  resource!: string;

  @Column({ type: 'varchar', length: 50 })
  action!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: false })
  requiresOwnership!: boolean;

  @Column({ type: 'boolean', default: false })
  isWildcard!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany('RolePermissionEntity', 'permission')
  rolePermissions!: RolePermissionEntity[];
}
