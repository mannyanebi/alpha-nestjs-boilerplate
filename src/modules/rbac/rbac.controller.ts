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
import {
  AuditAction,
  EntityType,
} from '../audit/constants/audit-actions.constant.ts';
import { AuditLog } from '../audit/decorators/audit-log.decorator.ts';
import { RoleType } from './constants/roles.constant.ts';
import { AssignPermissionsDto } from './dtos/assign-permissions.dto.ts';
import { CreateRoleDto } from './dtos/create-role.dto.ts';
import { RoleDto } from './dtos/role.dto.ts';
import { RoleDetailsDto } from './dtos/role-details.dto.ts';
import { RoleSummaryDto } from './dtos/role-summary.dto.ts';
import { UpdateRoleDto } from './dtos/update-role.dto.ts';
import { RbacService } from './rbac.service.ts';

@Controller('rbac/roles')
@ApiTags('rbac-roles')
export class RbacRoleController {
  constructor(private readonly rbacService: RbacService) {}

  @Post()
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: RoleDetailsDto })
  @ApiOperation({ summary: 'Create a new role with optional permissions' })
  @AuditLog({
    action: AuditAction.ROLE_CREATED,
    entityType: EntityType.ROLE,
    entityIdParam: 'name',
    captureBody: true,
  })
  createRole(@Body() createRoleDto: CreateRoleDto): Promise<RoleDetailsDto> {
    return this.rbacService.createRole(createRoleDto);
  }

  @Get()
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RoleDto, isArray: true })
  @ApiOperation({ summary: 'List all roles' })
  async getRoles(): Promise<RoleDto[]> {
    const roles = await this.rbacService.getRoles();

    return roles.map((role) => role.toDto());
  }

  @Get('summary')
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RoleSummaryDto, isArray: true })
  @ApiOperation({
    summary: 'List roles with user counts and permissions',
  })
  @AuditLog({
    action: AuditAction.ROLE_LISTED,
    entityType: EntityType.ROLE,
    message: 'Roles summary fetched',
  })
  getRoleSummary(): Promise<RoleSummaryDto[]> {
    return this.rbacService.getRolesSummary();
  }

  @Get(':id')
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOkResponse({ type: RoleDetailsDto })
  @ApiOperation({ summary: 'Get role details with permissions' })
  getRole(@UUIDParam('id') roleId: Uuid): Promise<RoleDetailsDto> {
    return this.rbacService.getRoleDetails(roleId);
  }

  @Patch(':id')
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOkResponse({ type: RoleDetailsDto })
  @ApiOperation({ summary: 'Update role details' })
  @AuditLog({
    action: AuditAction.ROLE_UPDATED,
    entityType: EntityType.ROLE,
    entityIdParam: 'id',
    captureBody: true,
  })
  updateRole(
    @UUIDParam('id') roleId: Uuid,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleDetailsDto> {
    return this.rbacService.updateRole(roleId, updateRoleDto);
  }

  @Post(':id/permissions')
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOkResponse({ type: RoleDetailsDto })
  @ApiOperation({ summary: 'Add permissions to a role' })
  @AuditLog({
    action: AuditAction.PERMISSION_GRANTED,
    entityType: EntityType.ROLE,
    entityIdParam: 'id',
    captureBody: true,
  })
  assignPermissions(
    @UUIDParam('id') roleId: Uuid,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ): Promise<RoleDetailsDto> {
    return this.rbacService.assignPermissions(roleId, assignPermissionsDto);
  }

  @Delete(':id/permissions/:permissionId')
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiUUIDParam('permissionId')
  @ApiOkResponse({ type: RoleDetailsDto })
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @AuditLog({
    action: AuditAction.PERMISSION_REVOKED,
    entityType: EntityType.ROLE,
    entityIdParam: 'id',
  })
  removePermission(
    @UUIDParam('id') roleId: Uuid,
    @UUIDParam('permissionId') permissionId: Uuid,
  ): Promise<RoleDetailsDto> {
    return this.rbacService.removePermission(roleId, permissionId);
  }

  @Delete(':id')
  @Auth([RoleType.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiUUIDParam('id')
  @ApiOperation({ summary: 'Delete a role' })
  @AuditLog({
    action: AuditAction.ROLE_DELETED,
    entityType: EntityType.ROLE,
    entityIdParam: 'id',
  })
  async deleteRole(@UUIDParam('id') roleId: Uuid): Promise<void> {
    await this.rbacService.deleteRole(roleId);
  }
}
