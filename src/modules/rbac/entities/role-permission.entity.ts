import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { PermissionEntity } from './permission.entity.ts';
import { RoleEntity } from './role.entity.ts';

@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermissionEntity {
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId!: Uuid;

  @PrimaryColumn({ name: 'permission_id', type: 'uuid' })
  permissionId!: Uuid;

  @ManyToOne(() => RoleEntity, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;

  @ManyToOne(
    () => PermissionEntity,
    (permission) => permission.rolePermissions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'permission_id' })
  permission!: PermissionEntity;
}
