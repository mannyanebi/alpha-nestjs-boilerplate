# Alpha Nestjs Boilerplate

A production-ready NestJS boilerplate with TypeScript, PostgreSQL, TypeORM, JWT authentication, role-based access control, and comprehensive API documentation.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development](#development)
- [Migration Management](#migration-management)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)
- [Developer Experience](#developer-experience)
- [Documentation](#documentation)

## ✨ Features

- 🏗️ **Modular Architecture** - Clean separation of concerns with NestJS modules
- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control (RBAC)
- 📊 **Database Integration** - TypeORM with PostgreSQL and migration support
- 📝 **API Documentation** - Auto-generated Swagger/OpenAPI documentation
- 🌍 **Internationalization** - Multi-language support with nestjs-i18n
- ✅ **Validation** - Request validation with class-validator and custom decorators
- 🧪 **Testing** - Unit and E2E testing setup with Jest
- 🔒 **Security** - Helmet, throttling, and comprehensive security features
- 📦 **File Upload** - AWS S3 integration for file storage
- 🚀 **Performance** - Hot reload, compression, and optimized builds
- 🎯 **CQRS Pattern** - Command Query Responsibility Segregation support
- 🔄 **Transaction Support** - Database transaction management
- 📈 **Health Checks** - Built-in health check endpoints

## 🏛️ Architecture

This project follows clean architecture principles with a modular structure:

```
src/
├── modules/          # Feature modules (auth, user, post, etc.)
│   ├── auth/        # Authentication & authorization
│   ├── user/        # User management
│   └── post/        # Example business module
├── common/          # Shared utilities and base classes
│   ├── dto/         # Data transfer objects
│   └── utils.ts     # Utility functions
├── decorators/      # Custom decorators (auth, validation, swagger)
├── guards/          # Route guards (auth, roles)
├── filters/         # Exception filters
├── interceptors/    # Request/response interceptors
├── validators/      # Custom validators (unique, exists, etc.)
├── providers/       # Service providers
└── database/        # Database configuration and migrations
```

### Key Design Patterns

- **CQRS** - Separates read and write operations
- **Repository Pattern** - Data access abstraction with TypeORM
- **Dependency Injection** - NestJS DI container
- **DTO Pattern** - Request/response validation and transformation
- **Decorator Pattern** - Custom decorators for cross-cutting concerns

## 🛠️ Tech Stack

### Core
- **Runtime**: Node.js 22+ (with Bun/Deno support)
- **Framework**: NestJS 11
- **Language**: TypeScript 5.8
- **Database**: PostgreSQL with TypeORM 0.3
- **Authentication**: JWT (jsonwebtoken + passport-jwt)
- **Validation**: class-validator, class-transformer

### Infrastructure
- **API Docs**: Swagger/OpenAPI (@nestjs/swagger)
- **File Storage**: AWS S3 SDK v3
- **Security**: Helmet, throttling, bcrypt
- **i18n**: nestjs-i18n
- **Testing**: Jest, Supertest

### Development Tools
- **Build**: Vite 6, SWC, esbuild
- **Linting**: ESLint 9, Biome
- **Code Quality**: Prettier, Husky, lint-staged
- **Package Manager**: Yarn 1.22

## 📦 Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/) (v22.0.0 or higher)
- [Yarn](https://yarnpkg.com/) (v1.22.22+)
- [PostgreSQL](https://www.postgresql.org/) (v12 or higher)
- [Git](https://git-scm.com/)

## 🚀 Quick Start

```bash
# 1. Install dependencies
yarn install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and configuration

# 3. Run database migrations
yarn migration:run

# 4. Start development server
yarn start:dev

# 5. Access the application
# API: http://localhost:3000
# Swagger Docs: http://localhost:3000/documentation
```

### Environment Configuration

Key environment variables in `.env`:

```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1.0.0

# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nest_boilerplate

# JWT Authentication
JWT_EXPIRATION_TIME=3600
JWT_PRIVATE_KEY=your_private_key
JWT_PUBLIC_KEY=your_public_key

# AWS S3 (optional)
AWS_S3_BUCKET_NAME=your_bucket
AWS_S3_BUCKET_REGION=eu-central-1

# Features
ENABLE_DOCUMENTATION=true
ENABLE_ORM_LOGS=true
```

## 💻 Development

### Development Server

```bash
# Start with hot reload (Vite)
yarn start:dev

# Start with NestJS CLI watch mode
yarn nest:start:dev

# Start with Bun runtime
yarn start:dev:bun

# Debug mode
yarn nest:start:debug
```

### Code Generation

Generate new resources using the custom schematics:

```bash
# Generate module, controller, service, etc.
yarn g module feature-name
yarn g controller feature-name
yarn g service feature-name

# Or use shorthand
yarn g resource feature-name
```

## 🗄️ Migration Management

TypeORM migrations for database schema management:

### `yarn migration:generate`
Auto-generates migration by comparing entities with database schema.

```bash
yarn migration:generate src/database/migrations/AddUserTable
```

### `yarn migration:create`
Creates an empty migration file for manual migration logic.

```bash
yarn migration:create src/database/migrations/CustomMigration
```

### `yarn migration:run`
Executes all pending migrations.

```bash
yarn migration:run
```

### `yarn migration:revert`
Reverts the most recent migration.

```bash
yarn migration:revert
```

### `yarn migration:show`
Shows migration status (applied vs pending).

```bash
yarn migration:show
```

### `yarn schema:drop`
⚠️ **Drops all database tables** - Use with caution!

```bash
yarn schema:drop
```

All migration commands use `typeorm-ts-node-esm` and reference `ormconfig.ts`.

## 🧪 Testing

```bash
# Unit tests
yarn test

# Unit tests with watch mode
yarn test:watch

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov

# Debug tests
yarn test:debug
```

## 🏗️ Build & Deployment

### Production Build

```bash
# Build with NestJS CLI
yarn build:prod

# Build with Bun
yarn build:bun

# Start production server
yarn start:prod
```

The compiled output will be in the `dist/` directory.

### Docker Support

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## 🎨 Developer Experience

### Code Quality

```bash
# Run linter
yarn lint

# Fix linting issues
yarn lint:fix

# Format code (via lint-staged on commit)
git commit
```

### Pre-commit Hooks

Husky + lint-staged automatically:
- Runs ESLint on staged TypeScript files
- Formats code with Prettier
- Validates commit messages

### Hot Reload

Development server uses Vite for lightning-fast hot module replacement (HMR):
- ⚡ Instant server restart on file changes
- 🔥 Fast compilation with SWC
- 📦 Optimized for large codebases

### IDE Setup

Recommended VS Code extensions:
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner
- REST Client

### Type Safety

- Strict TypeScript configuration
- Comprehensive type definitions
- DTO validation at runtime
- Type-safe database queries with TypeORM

## 📚 Documentation

Comprehensive documentation available in the `docs/` directory:

- **[Getting Started](docs/getting-started.md)** - Setup and installation guide
- **[Architecture](docs/architecture.md)** - System design and patterns
- **[Development](docs/development.md)** - Development workflow
- **[Code Style](docs/code-style-and-patterns.md)** - Coding standards
- **[Testing](docs/testing.md)** - Testing strategies
- **[Deployment](docs/deployment.md)** - Production deployment
- **[API Documentation](docs/api-documentation.md)** - API reference

### API Documentation

When `ENABLE_DOCUMENTATION=true`, Swagger UI is available at:
- **Local**: http://localhost:3000/documentation
- **Staging/Prod**: https://your-domain.com/documentation

## 📝 License

This project is licensed under the MIT License.

## 👥 Author

**Narek Hakobyan** - [narek.hakobyan.07@gmail.com](mailto:narek.hakobyan.07@gmail.com)

**Emmanuel Anebi** - [anebiemmanuel@gmail.com](mailto:anebiemmanuel@gmail.com)

---

Built with ❤️ using [NestJS](https://nestjs.com/)
