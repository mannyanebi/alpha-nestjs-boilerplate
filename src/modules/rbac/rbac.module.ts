import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionsGuard } from '../../guards/permissions.guard.ts';
import { PermissionEntity } from './entities/permission.entity.ts';
import { RoleEntity } from './entities/role.entity.ts';
import { RolePermissionEntity } from './entities/role-permission.entity.ts';
import { RbacPermissionsController } from './rbac-permissions.controller.ts';
import { RbacRoleController } from './rbac.controller.ts';
import { RbacService } from './rbac.service.ts';
import { UserEntity } from '../user/user.entity.ts';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      UserEntity,
    ]),
  ],
  controllers: [RbacRoleController, RbacPermissionsController],
  providers: [RbacService, PermissionsGuard],
  exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
