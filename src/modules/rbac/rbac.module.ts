import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionsGuard } from '../../guards/permissions.guard.ts';
import { UserEntity } from '../user/user.entity.ts';
import { PermissionEntity } from './entities/permission.entity.ts';
import { RoleEntity } from './entities/role.entity.ts';
import { RolePermissionEntity } from './entities/role-permission.entity.ts';
import { RbacRoleController } from './rbac.controller.ts';
import { RbacService } from './rbac.service.ts';

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
  controllers: [RbacRoleController],
  providers: [RbacService, PermissionsGuard],
  exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
