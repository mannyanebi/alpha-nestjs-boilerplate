# Audit Logging System - Usage Guide

## Overview
The audit logging system automatically captures security-critical events across the CROPTERA platform with minimal code changes.

## Quick Start

### 1. Automatic Logging with Decorator

```typescript
import { Controller, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, EntityType } from '../audit/constants/audit-actions.constant';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ✅ Logs user creation automatically
  @Post()
  @AuditLog({
    action: AuditAction.USER_CREATED,
    entityType: EntityType.USER,
    captureBody: true, // Captures request body in new_values
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // ✅ Logs user deactivation with entity ID from params
  @Patch(':id/deactivate')
  @AuditLog({
    action: AuditAction.USER_DEACTIVATED,
    entityType: EntityType.USER,
    entityIdParam: 'id', // Extracts ID from route params
  })
  async deactivateUser(@Param('id') id: string) {
    return this.userService.deactivate(id);
  }

  // ✅ Logs deletion
  @Delete(':id')
  @AuditLog({
    action: AuditAction.USER_DELETED,
    entityType: EntityType.USER,
    entityIdParam: 'id',
  })
  async deleteUser(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

### 2. Manual Logging for Complex Scenarios

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../audit/audit-log.service';
import { AuditAction, EntityType } from '../audit/constants/audit-actions.constant';

@Injectable()
export class UserService {
  constructor(private readonly auditLogService: AuditLogService) {}

  async updateUser(id: string, updateDto: UpdateUserDto, currentUser: any) {
    // Get old state
    const oldUser = await this.userRepository.findOne({ where: { id } });
    
    // Perform update
    const updatedUser = await this.userRepository.save({
      ...oldUser,
      ...updateDto,
    });

    // ✅ Log update with automatic diff calculation
    await this.auditLogService.logUpdate({
      userId: currentUser.id,
      action: AuditAction.USER_UPDATED,
      entityType: EntityType.USER,
      entityId: id,
      oldEntity: oldUser,
      newEntity: updatedUser,
      ipAddress: currentUser.ipAddress,
      source: 'web',
    });

    return updatedUser;
  }

  async approveReading(readingId: string, approvedBy: string) {
    const reading = await this.readingRepository.findOne({ 
      where: { id: readingId } 
    });

    reading.status = 'approved';
    reading.approvedBy = approvedBy;
    await this.readingRepository.save(reading);

    // ✅ Direct logging
    await this.auditLogService.create({
      userId: approvedBy,
      action: AuditAction.READING_APPROVED,
      entityType: EntityType.READING,
      entityId: readingId,
      newValues: { status: 'approved', approvedBy },
      source: 'web',
      status: 'success',
    });
  }
}
```

### 3. System Actions (No User Context)

```typescript
@Injectable()
export class CronService {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Cron('0 0 * * *') // Daily at midnight
  async cleanupExpiredData() {
    const deletedCount = await this.trialRepository.deleteExpired();

    // ✅ Log system action
    await this.auditLogService.logSystemAction(
      AuditAction.TRIAL_DELETED,
      EntityType.TRIAL,
      'system-cleanup',
      { deletedCount, reason: 'automated-cleanup' },
    );
  }
}
```

### 4. Authentication Events

```typescript
@Injectable()
export class AuthService {
  constructor(private readonly auditLogService: AuditLogService) {}

  async login(email: string, password: string, ipAddress: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      // ✅ Log failed login attempt
      await this.auditLogService.create({
        userId: user?.id || null,
        action: AuditAction.LOGIN_FAILED,
        entityType: EntityType.USER,
        entityId: email,
        ipAddress,
        status: 'failed',
        errorMessage: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // ✅ Log successful login
    await this.auditLogService.create({
      userId: user.id,
      action: AuditAction.LOGIN_SUCCESS,
      entityType: EntityType.USER,
      entityId: user.id,
      ipAddress,
      status: 'success',
    });

    return this.generateTokens(user);
  }
}
```

### 5. Mobile App Support

The system automatically detects the source (web/mobile) via the `x-client-type` header:

```typescript
// Mobile app should send this header
headers: {
  'x-client-type': 'mobile'
}
```

Logs will show:
```json
{
  "source": "mobile",
  "userAgent": "CropteraMobile/1.0.0 (iOS 15.0)"
}
```

## Querying Audit Logs

```typescript
@Injectable()
export class AuditReportService {
  constructor(private readonly auditLogService: AuditLogService) {}

  async getUserActivity(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [logs, total] = await this.auditLogService.findLogs({
      userId,
      startDate,
      limit: 100,
    });

    return { logs, total };
  }

  async getEntityHistory(entityType: string, entityId: string) {
    const [logs, total] = await this.auditLogService.findLogs({
      entityType,
      entityId,
      limit: 50,
    });

    return { logs, total };
  }

  async getFailedLoginAttempts(hours: number = 24) {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const [logs, total] = await this.auditLogService.findLogs({
      action: AuditAction.LOGIN_FAILED,
      startDate,
      limit: 100,
    });

    return { logs, total };
  }
}
```

## What Gets Logged Automatically

When using the `@AuditLog()` decorator, the system captures:
- ✅ User ID (from JWT token)
- ✅ IP Address (including proxy headers)
- ✅ User Agent (browser/mobile app info)
- ✅ Source (web/mobile/system)
- ✅ Timestamp (with timezone)
- ✅ Action outcome (success/failed)
- ✅ Error messages (on failure)
- ✅ Request body (if captureBody: true)

## Security Features

1. **Sensitive Data Sanitization**: Passwords, tokens automatically removed
2. **Immutable Records**: Audit logs are append-only (no updates/deletes)
3. **Failed Attempts**: Even failed operations are logged
4. **Non-blocking**: Audit failures don't break main flow
5. **Indexed Queries**: Optimized for fast searches

## Best Practices

1. **Use Decorators for Simple Cases**: Less code, automatic capture
2. **Manual Logging for Updates**: When you need old vs. new values
3. **Always Log Authentication Events**: Success and failures
4. **Add Context in Metadata**: Trial IDs, location info, etc.
5. **Mobile Detection**: Ensure mobile apps send `x-client-type` header

## Adding New Actions

```typescript
// In audit-actions.constant.ts
export enum AuditAction {
  // ... existing actions
  
  // New field book actions
  FIELD_BOOK_CREATED = 'FIELD_BOOK_CREATED',
  FIELD_BOOK_SUBMITTED = 'FIELD_BOOK_SUBMITTED',
  FIELD_DATA_SYNCED = 'FIELD_DATA_SYNCED',
}

export enum EntityType {
  // ... existing types
  FIELD_BOOK = 'FieldBook',
}
```

Then use immediately:
```typescript
@Post('field-books')
@AuditLog({
  action: AuditAction.FIELD_BOOK_CREATED,
  entityType: EntityType.FIELD_BOOK,
  captureBody: true,
})
async createFieldBook(@Body() dto: CreateFieldBookDto) {
  return this.fieldBookService.create(dto);
}
```

## Migration

To apply the database changes:

```bash
npm run migration:run
```

To rollback:

```bash
npm run migration:revert
```
