import { Column, Entity, Index, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstract.entity.ts';
import { UseDto } from '../../../decorators/use-dto.decorator.ts';
import { RoleDto } from '../dtos/role.dto.ts';
import { RolePermissionEntity } from './role-permission.entity.ts';

@Entity('roles')
@UseDto(RoleDto)
export class RoleEntity extends AbstractEntity<RoleDto> {
  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', default: 1 })
  hierarchy!: number; // 1=Agronomist, 2=Senior, 3=MEAL, 4=Super Admin

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(
    () => RolePermissionEntity,
    (rolePermission) => rolePermission.role,
    { cascade: true },
  )
  rolePermissions!: RolePermissionEntity[];
}
