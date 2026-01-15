import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  ApiUUIDParam,
  Auth,
  UUIDParam,
} from '../../decorators/http.decorators.ts';
import { AuditAction, EntityType } from '../audit/constants/audit-actions.constant.ts';
import { AuditLog } from '../audit/decorators/audit-log.decorator.ts';
import { RoleType } from './constants/roles.constant.ts';
import { CreatePermissionDto } from './dtos/create-permission.dto.ts';
import { PermissionDto } from './dtos/permission.dto.ts';
import { UpdatePermissionDto } from './dtos/update-permission.dto.ts';
import { RbacService } from './rbac.service.ts';

@Controller('rbac/permissions')
@ApiTags('rbac-permissions')
export class RbacPermissionsController {
  constructor(private readonly rbacService: RbacService) {}

  @Post()
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: PermissionDto })
  @ApiOperation({ summary: 'Create a new permission' })
  @AuditLog({
    action: AuditAction.PERMISSION_CREATED,
    entityType: EntityType.PERMISSION,
    entityIdParam: 'slug',
    captureBody: true,
  })
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionDto> {
    const permission = await this.rbacService.createPermission(
      createPermissionDto,
    );

    return permission.toDto();
  }

  @Get()
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PermissionDto, isArray: true })
  @ApiOperation({ summary: 'List all permissions' })
  async getPermissions(): Promise<PermissionDto[]> {
    const permissions = await this.rbacService.getPermissions();

    return permissions.map((permission) => permission.toDto());
  }

  @Get(':id')
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOkResponse({ type: PermissionDto })
  @ApiOperation({ summary: 'Get permission details' })
  async getPermission(
    @UUIDParam('id') permissionId: Uuid,
  ): Promise<PermissionDto> {
    const permission = await this.rbacService.getPermissionDetails(permissionId);

    return permission.toDto();
  }

  @Patch(':id')
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOkResponse({ type: PermissionDto })
  @ApiOperation({ summary: 'Update a permission' })
  @AuditLog({
    action: AuditAction.PERMISSION_UPDATED,
    entityType: EntityType.PERMISSION,
    entityIdParam: 'id',
    captureBody: true,
  })
  async updatePermission(
    @UUIDParam('id') permissionId: Uuid,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionDto> {
    const permission = await this.rbacService.updatePermission(
      permissionId,
      updatePermissionDto,
    );

    return permission.toDto();
  }

  @Delete(':id')
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOperation({ summary: 'Delete a permission' })
  @AuditLog({
    action: AuditAction.PERMISSION_DELETED,
    entityType: EntityType.PERMISSION,
    entityIdParam: 'id',
  })
  async deletePermission(@UUIDParam('id') permissionId: Uuid): Promise<void> {
    await this.rbacService.deletePermission(permissionId);
  }
}
