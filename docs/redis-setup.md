# Redis Setup Documentation

## Overview

The application uses Redis for caching and BullMQ queue management with support for both localhost and secured remote connections.

## Configuration

### Environment Variables

```bash
# Enable/disable Redis
REDIS_CACHE_ENABLED=true

# Option 1: Connection String (takes precedence)
REDIS_URL=rediss://default:password@host:port

# Option 2: Individual host/port (fallback)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logical Database separation
REDIS_CACHE_DB=0    # Database for cache operations
REDIS_QUEUE_DB=0    # Database for BullMQ queues (can use 1 for separation)
```

### Connection Modes

**Localhost (Development):**
```bash
REDIS_URL=
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Secured Remote (Production):**
```bash
REDIS_URL=rediss://default:password@prosev-redis.com:25061
```

## Usage

### 1. Caching with @nestjs/cache-manager

The cache is globally available with a 30-minute TTL default.

**Inject and use:**

```typescript
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUser(id: string) {
    // Try cache first
    const cached = await this.cacheManager.get(`user:${id}`);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await this.userRepository.findOne(id);

    // Store in cache (30 min TTL)
    await this.cacheManager.set(`user:${id}`, user);

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto) {
    const user = await this.userRepository.update(id, data);

    // Invalidate cache
    await this.cacheManager.del(`user:${id}`);

    return user;
  }

  async clearUserCache() {
    // Clear all cache
    await this.cacheManager.reset();
  }
}
```

**Custom TTL:**

```typescript
// Set with custom TTL (in milliseconds)
await this.cacheManager.set('key', value, 60000); // 1 minute
```

**Use CacheTTL decorator:**

```typescript
import { CacheTTL, CacheKey } from '@nestjs/cache-manager';

@Injectable()
export class ProductService {
  @CacheTTL(60000) // 1 minute
  @CacheKey('all-products')
  async getAllProducts() {
    return this.productRepository.find();
  }
}
```

### 2. BullMQ Queue Setup

**Create a queue module:**

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisService } from '@shared/services/redis.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (redisService: RedisService) => ({
        connection: redisService.getQueueConnectionOptions(),
      }),
      inject: [RedisService],
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
})
export class QueueModule {}
```

**Add jobs to queue:**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async sendWelcomeEmail(userId: string, email: string) {
    await this.emailQueue.add('welcome', {
      userId,
      email,
    }, {
      delay: 5000, // 5 seconds delay
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
```

**Create queue processor:**

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'welcome':
        await this.sendWelcomeEmail(job.data);
        break;
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  private async sendWelcomeEmail(data: { userId: string; email: string }) {
    // Send email logic
    console.log(`Sending welcome email to ${data.email}`);
  }
}
```

### 3. Direct Redis Client Access

**Use RedisService directly for custom operations:**

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@shared/services/redis.service';

@Injectable()
export class SessionService {
  constructor(private redisService: RedisService) {}

  async setSession(sessionId: string, data: object) {
    const client = this.redisService.getCacheClient();
    await client.setex(sessionId, 3600, JSON.stringify(data)); // 1 hour
  }

  async getSession(sessionId: string) {
    const client = this.redisService.getCacheClient();
    const data = await client.get(sessionId);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string) {
    const client = this.redisService.getCacheClient();
    await client.del(sessionId);
  }

  async trackPageView(page: string) {
    const client = this.redisService.getCacheClient();
    await client.incr(`pageviews:${page}`);
  }
}
```

## Architecture

### Separate vs Shared Connections

**Cache Client** (`REDIS_CACHE_DB`):
- Used by @nestjs/cache-manager
- Stores application cache data
- Default DB: 0

**Queue Client** (`REDIS_QUEUE_DB`):
- Used by BullMQ for job queues
- Isolated from cache operations
- Default DB: 0 (can change to 1 for separation)

**Benefits of separation:**
- Prevents cache operations from blocking queue processing
- Better isolation and debugging
- Independent scaling and monitoring
- Different eviction policies per use case

## Connection String Parsing

The RedisService automatically handles connection strings:

```typescript
// rediss://username:password@host:port
// ↓ Parsed to ↓
{
  host: 'host',
  port: 'port',
  username: 'username',
  password: 'password',
  tls: { rejectUnauthorized: false },
  db: 0 // or from config
}
```

## Best Practices

1. **Use cache for expensive operations:**
   - Database queries with complex joins
   - External API calls
   - Computed/aggregated data

2. **Set appropriate TTLs:**
   - Frequently changing data: 1-5 minutes
   - Moderately stable data: 30 minutes (default)
   - Rarely changing data: 1-24 hours

3. **Invalidate cache on updates:**
   - Always clear cache when underlying data changes
   - Use cache keys with namespaces: `user:${id}`, `product:${id}`

4. **Use separate DBs in production:**
   ```bash
   REDIS_CACHE_DB=0
   REDIS_QUEUE_DB=1
   ```

5. **Monitor Redis memory:**
   - Set maxmemory policy in Redis config
   - Use Redis monitoring tools
   - Track cache hit/miss ratios

## Troubleshooting

**Connection issues:**
```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping
# Should return: PONG

# Test with auth
redis-cli -h host -p port -a password --tls ping
```

**Check logs:**
- RedisService logs connection status on startup
- Look for "Redis cache client connected" messages

**Clear all Redis data:**
```typescript
// Via cache manager
await this.cacheManager.reset();

// Via Redis client
const client = this.redisService.getCacheClient();
await client.flushdb(); // Clear current DB
await client.flushall(); // Clear all DBs (use cautiously!)
```

## Related

- [NestJS Cache Manager](https://docs.nestjs.com/techniques/caching)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [ioredis Documentation](https://github.com/redis/ioredis)
