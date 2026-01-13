# Auto-Seeding Documentation

## Overview

The auto-seeding feature automatically initializes the database with essential data when the application starts in development mode. This ensures developers have a working environment with pre-configured RBAC permissions and a Super Admin user.

## Features

- **Idempotent**: Safe to run multiple times - checks if data exists before inserting
- **Environment-Aware**: Only runs in `development` environment
- **Configurable**: Can be toggled on/off via environment variable
- **Logging**: Provides clear feedback about seeding operations

## How It Works

The `SeederService` runs during application initialization via the `OnModuleInit` lifecycle hook in `AppModule`. It performs two main operations:

1. **Seed RBAC Data**: Creates roles, permissions, and role-permission mappings
2. **Seed Super Admin User**: Creates a Super Admin user for immediate access

## Configuration

Add the following environment variables to your `.env` file:

```dotenv
# Enable/disable auto-seeding
ENABLE_AUTO_SEED=true

# Super Admin credentials
DEV_ADMIN_EMAIL=admin@croptera.local
DEV_ADMIN_PASSWORD=Pa$$w0rd!
DEV_ADMIN_FIRST_NAME=Super
DEV_ADMIN_LAST_NAME=Admin
```

## Requirements

- `NODE_ENV=development`
- `ENABLE_AUTO_SEED=true`

If either condition is not met, seeding will be skipped.

## Seeded Data

### RBAC Structure
- 4 Roles: Agronomist, Senior Agronomist, MEAL, Super Admin
- 50+ Permissions across 7 resources
- Role-Permission mappings with additive inheritance

See [RBAC README](../modules/rbac/README.md) for complete permission matrix.

### Super Admin User
- **Email**: From `DEV_ADMIN_EMAIL` (default: admin@croptera.local)
- **Password**: From `DEV_ADMIN_PASSWORD` (default: Pa$$w0rd!)
- **Name**: From `DEV_ADMIN_FIRST_NAME` and `DEV_ADMIN_LAST_NAME`
- **Role**: Super Admin with all permissions

## Usage

### Starting the Application

```bash
# Development mode with auto-seeding
NODE_ENV=development ENABLE_AUTO_SEED=true npm run start:dev
```

### Expected Console Output

```
🌱 Starting development database seeding...
🔐 Seeding RBAC data (roles & permissions)...
✅ RBAC data seeded successfully
👤 Creating Super Admin user (admin@croptera.local)...
✅ Super Admin user created successfully (admin@croptera.local)
✅ Database seeding completed successfully
```

### When Data Already Exists

```
🌱 Starting development database seeding...
ℹ️  RBAC data already exists, skipping RBAC seeding
ℹ️  Super Admin user (admin@croptera.local) already exists, skipping user seeding
✅ Database seeding completed successfully
```

### When Seeding is Disabled

```
Seeding skipped: ENABLE_AUTO_SEED is false
```

or

```
Seeding skipped: Not in development environment
```

## Logging In

After seeding, you can log in with:
- **Email**: admin@croptera.local (or your configured email)
- **Password**: Pa$$w0rd! (or your configured password)

## Implementation Details

### Files
- `src/shared/services/seeder.service.ts` - Core seeding logic
- `src/shared/seeder.module.ts` - Module registration
- `src/app.module.ts` - Lifecycle hook integration

### Idempotency
- **RBAC**: Checks if `super_admin` role exists before seeding
- **User**: Checks if user with configured email exists before creation

### Error Handling
If seeding fails, the error is logged and re-thrown, which will prevent the application from starting. This ensures the database is in a known good state.

## Troubleshooting

### Seeding Not Running
1. Check `NODE_ENV=development` is set
2. Verify `ENABLE_AUTO_SEED=true` in `.env`
3. Check console logs for skip messages

### Permission Denied Errors
Ensure the database user has permissions to:
- Create tables
- Insert data
- Read existing data

### Duplicate Key Errors
This should not happen due to idempotency checks. If it does:
1. Check database state manually
2. Drop and recreate the database
3. Report the issue

## Production Warning

⚠️ **IMPORTANT**: This feature is designed ONLY for development. It will not run if `NODE_ENV` is not `development`. Never enable auto-seeding in production environments.

## Related Documentation

- [RBAC Module](../modules/rbac/README.md)
- [User Module](../modules/user/)
- [Audit Module](../modules/audit/README.md)
