/**
 * Example: Using RBAC in Controllers
 *
 * This file demonstrates how to use the @RequirePermissions decorator
 * for role-based access control in CROPTERA
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '../constants/permissions.constant';
import { RequirePermissions } from '../decorators/require-permissions.decorator';

@Controller('readings')
@ApiTags('readings')
export class ReadingsControllerExample {
  // Example 1: Simple permission check
  @Get()
  @RequirePermissions(Permission.READINGS_VIEW_ALL)
  async getAllReadings() {
    // Senior Agronomist, MEAL, Super Admin can access
    return [];
  }

  // Example 2: Ownership-based permission with auto-scope
  @Get('my-readings')
  @RequirePermissions(Permission.READINGS_VIEW_OWN, { autoScope: true })
  async getMyReadings(@Query() query: any) {
    // Automatically filtered to current user's readings
    // query.userId is injected by the guard
    return [];
  }

  // Example 3: Ownership enforcement for single item
  @Get(':id')
  @RequirePermissions(Permission.READINGS_VIEW_OWN, { enforceOwnership: true })
  async getReading(@Param('id') id: string) {
    // Guard checks if reading.userId === currentUser.id
    // Throws 403 if user tries to view others' readings
    // Unless user has READINGS_VIEW_ALL permission
    return {};
  }

  // Example 4: Create reading (all roles)
  @Post()
  @RequirePermissions(Permission.READINGS_CREATE)
  async createReading(@Body() createDto: any) {
    // All authenticated users can create readings
    return {};
  }

  // Example 5: Edit own reading
  @Patch(':id')
  @RequirePermissions(Permission.READINGS_EDIT_OWN, { enforceOwnership: true })
  async updateReading(@Param('id') id: string, @Body() updateDto: any) {
    // Agronomists can only edit their own readings
    // Senior/MEAL/Super can edit any (they have READINGS_EDIT_ALL)
    return {};
  }

  // Example 6: Approve reading (Senior+ only)
  @Patch(':id/approve')
  @RequirePermissions(Permission.READINGS_APPROVE)
  async approveReading(@Param('id') id: string) {
    // Only Senior Agronomist, MEAL, Super Admin
    return {};
  }

  // Example 7: Multiple permissions (OR logic)
  @Patch(':id/status')
  @RequirePermissions([Permission.READINGS_APPROVE, Permission.READINGS_REJECT])
  async changeStatus(@Param('id') id: string, @Body() dto: any) {
    // User needs EITHER approve OR reject permission
    return {};
  }

  // Example 8: Multiple permissions (AND logic)
  @Delete(':id')
  @RequirePermissions(
    [Permission.READINGS_OVERRIDE, Permission.SYSTEM_CONFIG],
    { requireAll: true },
  )
  async forceDeleteReading(@Param('id') id: string) {
    // User needs BOTH permissions (Super Admin only)
    return {};
  }
}

@Controller('trials')
@ApiTags('trials')
export class TrialsControllerExample {
  // View trials (all roles)
  @Get()
  @RequirePermissions(Permission.TRIALS_VIEW)
  async getAllTrials() {
    return [];
  }

  // Create trial (Senior+)
  @Post()
  @RequirePermissions(Permission.TRIALS_CREATE)
  async createTrial(@Body() createDto: any) {
    // Senior Agronomist, MEAL, Super Admin
    return {};
  }

  // Assign agronomist to trial (Senior+)
  @Post(':id/assignments')
  @RequirePermissions(Permission.TRIALS_ASSIGNMENTS_CREATE)
  async assignAgronomist(@Param('id') id: string, @Body() dto: any) {
    return {};
  }

  // View own assignments (Agronomist can see their own)
  @Get('my-assignments')
  @RequirePermissions(Permission.TRIALS_ASSIGNMENTS_VIEW, { autoScope: true })
  async getMyAssignments() {
    // Agronomists see only their assignments
    // Senior+ see all assignments
    return [];
  }

  // Archive trial (Senior+)
  @Patch(':id/archive')
  @RequirePermissions(Permission.TRIALS_ARCHIVE)
  async archiveTrial(@Param('id') id: string) {
    return {};
  }

  // Reopen archived trial (Super Admin only)
  @Patch(':id/reopen')
  @RequirePermissions(Permission.TRIALS_REOPEN)
  async reopenTrial(@Param('id') id: string) {
    return {};
  }

  // Delete trial (Super Admin only)
  @Delete(':id')
  @RequirePermissions(Permission.TRIALS_DELETE)
  async deleteTrial(@Param('id') id: string) {
    return {};
  }
}

@Controller('users')
@ApiTags('users')
export class UsersControllerExample {
  // View users (Senior+)
  @Get()
  @RequirePermissions(Permission.USERS_VIEW)
  async getAllUsers() {
    return [];
  }

  // Create staff (Senior+)
  @Post('staff')
  @RequirePermissions(Permission.USERS_CREATE_STAFF)
  async createStaff(@Body() createDto: any) {
    // Can only create Agronomist accounts
    return {};
  }

  // Create admin (Super Admin only)
  @Post('admin')
  @RequirePermissions(Permission.USERS_CREATE_ADMIN)
  async createAdmin(@Body() createDto: any) {
    // Can create Senior Agronomist, MEAL, or Super Admin
    return {};
  }

  // Assign role (Super Admin only)
  @Patch(':id/role')
  @RequirePermissions(Permission.USERS_ASSIGN_ROLES)
  async assignRole(@Param('id') id: string, @Body() dto: any) {
    return {};
  }
}

@Controller('analytics')
@ApiTags('analytics')
export class AnalyticsControllerExample {
  // Basic dashboard (all roles)
  @Get('dashboard')
  @RequirePermissions(Permission.ANALYTICS_VIEW_BASIC)
  async getBasicDashboard() {
    return {};
  }

  // Advanced analytics (MEAL+)
  @Get('advanced')
  @RequirePermissions(Permission.ANALYTICS_VIEW_ADVANCED)
  async getAdvancedAnalytics() {
    // MEAL and Super Admin only
    return {};
  }

  // Export data (MEAL+)
  @Get('export')
  @RequirePermissions(Permission.ANALYTICS_EXPORT)
  async exportData(@Query() query: any) {
    return {};
  }

  // Statistical models (MEAL+)
  @Post('models/anova')
  @RequirePermissions(Permission.ANALYTICS_MODELS)
  async runAnova(@Body() dto: any) {
    return {};
  }
}

/**
 * Manual Permission Checking in Services
 */
export class ReadingsServiceExample {
  constructor(private readonly rbacService: RbacService) {}

  async findReadingById(id: string, currentUser: any) {
    const reading = await this.readingsRepository.findOne({ where: { id } });

    if (!reading) {
      throw new NotFoundException('Reading not found');
    }

    // Manual ownership check
    const hasViewAll = await this.rbacService.hasPermission(
      currentUser.role,
      Permission.READINGS_VIEW_ALL,
    );

    if (!hasViewAll && reading.userId !== currentUser.id) {
      throw new ForbiddenException('You can only view your own readings');
    }

    return reading;
  }

  async canApproveReading(userId: string, userRole: string): Promise<boolean> {
    return this.rbacService.hasPermission(
      userRole as any,
      Permission.READINGS_APPROVE,
    );
  }
}
