# Redis Setup Documentation

## Overview

The application uses Redis for caching and BullMQ queue management with support for both localhost and secured remote connections. The caching implementation uses **Keyv with @keyv/redis** as the store adapter, while BullMQ uses **ioredis** directly for optimal queue performance.

## Architecture

### Cache Layer (Keyv + @keyv/redis)

- Uses `@nestjs/cache-manager` with Keyv architecture
- Backed by `@keyv/redis` store for Redis persistence
- Provides a unified caching interface with automatic serialization
- TTL management at 30 minutes by default

### Queue Layer (BullMQ + ioredis)

- Uses `ioredis` client directly for maximum performance
- Separate connection from cache to isolate workloads
- Supports complex job patterns and scheduling

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
REDIS_CACHE_DB=0
REDIS_QUEUE_DB=0
```

**Secured Remote (Production):**

```bash
REDIS_URL=rediss://default:password@prosev-redis.com:25061
# Note: When using REDIS_URL, the database is included in the URL
# Format: redis://host:port/database or rediss://user:pass@host:port/database
```

### How Connection Strings Work

The application automatically builds Redis connection strings from your config:

- **With REDIS_URL**: Uses the provided connection string directly
- **Without REDIS_URL**: Builds connection string as `redis://host:port/database`
- **TLS Support**: Automatically enabled for `rediss://` URLs (without certificate verification)
- **Database Selection**:
  - Cache uses `REDIS_CACHE_DB`
  - BullMQ uses `REDIS_QUEUE_DB`
  - Both can use DB 0 or separate DBs (e.g., 0 and 1)

## Implementation Details

### Cache Manager Setup

The application uses `@keyv/redis` as the store for `@nestjs/cache-manager`. This provides:

- **Automatic serialization/deserialization** of JavaScript objects
- **Keyv namespace support** for key organization (prefix: `cache:`)
- **Native Redis persistence** with proper TTL management
- **Compatibility** with NestJS v10+ cache architecture

The setup in `shared.module.ts`:

```typescript
import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';

CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async (configService: ApiConfigService) => {
    const redisConfig = configService.redisConfig;
    
    // Build Redis connection URL
    let connectionString: string;

    if (redisConfig.url) {
      connectionString = redisConfig.url;
    } else {
      connectionString = `redis://${redisConfig.host}:${redisConfig.port}/${redisConfig.cacheDb}`;
    }

    const keyvOptions: KeyvOptions = {
      namespace: appConfig.name.toLowerCase() + '_cache',
      ttl: 30 * 60 * 1000, // 30 minutes in milliseconds
    };

    // Create KeyvRedis store (NestJS will wrap it in Keyv internally)
    const store = new KeyvRedis(connectionString, keyvOptions);

    return {
      stores: [store],
      ttl: 30 * 60 * 1000, // 30 minutes in milliseconds
    };
  },
  inject: [ApiConfigService],
})
```

## Usage

### 1. Caching with @nestjs/cache-manager

The cache is globally available with a 30-minute TTL default. All cache keys are automatically prefixed with `appConfig:` namespace, in this case `prosev_cache`.

**Inject and use:**

```typescript
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,

// Keys in Redis will be stored as: cache:key
```

**Important: Cache Keys in Redis**

All cache keys are prefixed with `prosev_cache:` namespace by Keyv. For example:

- `cacheManager.set('user:123', data)` → Redis key: `prosev_cache:user:123`
- `cacheManager.set('products', data)` → Redis key: `prosev_cache:products`

You can view all cache keys in Redis:

```bash
redis-cli keys "prosev_cache:*"
```

**Use CacheTTL decorator:**

```typescript
import { CacheTTL, CacheKey } from '@nestjs/cache-manager';
```

BullMQ uses a **separate ioredis connection** from the cache layer for optimal performance and isolation. The `RedisService` provides connection options that BullMQ can use.

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

**Why separate connections?**

1. **Performance**: Queue operations won't block cache operations
2. **Isolation**: Different databases for easier management
3. **Monitoring**: Track cache vs queue Redis metrics separately
4. **Scaling**: Scale cache and queue layers independentlyAutomatically deserialized from JSON
const user = await this.cacheManager.get('user:123');
// user is a JavaScript object, not a string
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
    await this.emailQueue.add('we (Advanced)
```

For advanced use cases that need direct Redis access (like sessions, pub/sub, or rate limiting), use the `RedisService`:

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

**Technical Architecture**

### Cache Layer (Keyv + Redis)

```
@nestjs/cache-manager
       ↓
    Keyv (wrapper)
       ↓
@keyv/redis (store adapter)
       ↓
   Redis Server
```

- **Namespace**: `prosev_cache:`
- **Serialization**: Automatic JSON
- **TTL**: 30 minutes default (configurable)
- **Database**: `REDIS_CACHE_DB` (default: 0)

### Queue Layer (BullMQ + ioredis)

```
@nestjs/bullmq
       ↓
     BullMQ
       ↓
    ioredis
       ↓
  Redis Server
```

- **Namespace**: Queue-specific prefixes
- **Connection**: Separate from cache
- **Database**: `REDIS_QUEUE_DB` (default: 0, recommend: 1)

### Separate vs Shared Connections

**Cache Connection** (`REDIS_CACHE_DB`):

- Managed by `@keyv/redis` internally
- Used through `@nestjs/cache-manager`
- Optimized for get/set operations
- Default DB: 0

**Queue Connection** (`REDIS_QUEUE_DB`):

- Managed by `RedisService` with ioredis
- Used by BullMQ for job queues
- Optimized for list/stream operations
- Default DB: 0 (can change to 1 for separation)

**Benefits of separation:**

- Prevents cache operations from blocking queue processing
- Better isolation and debugging
- Independent scaling and monitoring
- Different eviction policies per use case
- Clear separation of concerns

### Connection String Handling

The `RedisService` automatically parses connection strings for BullMQ:

```typescript
// Input: rediss://username:password@host:port/0
// ↓ Parsed to ioredis options ↓
{
  host: 'host',
  port: 'port',
  username: 'username',
  password: 'password',
  tls: { rejectUnauthorized: false },
  db: 0 // or from config
}
```

Debugging & Monitoring

### View Cache Keys in Redis

All cache keys are prefixed with `prosev_cache:`:

```bash
# View all cache keys
redis-cli keys "cache:*"

# Get a specific cache value
redis-cli get "cache:user:123"

# Check TTL
redis-cli ttl "cache:user:123"

# Count cache keys
redis-cli keys "cache:*" | wc -l
```

### Monitor Redis Operations

Watch real-time Redis commands:

```bash
# Monitor all operations
redis-cli monitor

# You should see cache operations like:
# SET "cache:user:123" "{\"id\":\"123\",\"name\":\"John\"}" PX 1800000
# GET "cache:user:123"
# DEL "cache:user:123"
```

### Cache Statistics

Check cache effectiveness:

```typescript
@Injectable()
export class CacheMonitorService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getCacheStats() {
    // Implement custom logic to track hits/misses
    // You can use Redis INFO command for server stats
  }
}
```

## Troubleshooting

### Connection Issues

**Test Redis connection:**

```bash
# Basic connectivity
redis-cli -h localhost -p 6379 ping
```

# Package Dependencies

```json
{
  "@keyv/redis": "^latest",
  "@nestjs/cache-manager": "^latest",
  "@nestjs/bullmq": "^latest",
  "ioredis": "^5.x",
  "bullmq": "^latest",
  "cache-manager": "^7.x"
}
```

## Related Documentation

- [NestJS Cache Manager](https://docs.nestjs.com/techniques/caching)
- [Keyv Documentation](https://keyv.org/)
- [@keyv/redis](https://github.com/jaredwray/keyv/tree/main/packages/redis)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Commands Reference](<https://redis.io/command>

# Check specific database

```bash
redis-cli -n 0 ping

```

**Check application logs:**

```bash
# Look for these log messages:
[RedisService] Redis cache client connected
[RedisService] Redis queue client connected
```

### Cache Not Working

**1. Verify Redis is receiving cache operations:**

```bash
redis-cli monitor
# Call a cached endpoint, you should see SET/GET commands
```

**2. Check cache keys exist:**

```bash
redis-cli keys "cache:*"
# Should show keys with cache: prefix
```

**3. Verify cache configuration:**

```typescript
// In your service
const value = await this.cacheManager.get('test-key');
console.log('Cache value:', value);
```

### Clear Cache Data

**Clear all cache (keeps queue data):**

```typescript
// Via cache manager
await this.cacheManager.reset();
```

**Clear specific cache keys:**

```bash
# Delete all cache keys
redis-cli --scan --pattern "cache:*" | xargs redis-cli del

# Delete specific pattern
redis-cli --scan --pattern "cache:user:*" | xargs redis-cli del
```

**Clear entire database (dangerous!):**

```bash
# Clear current database only
redis-cli flushdb

# Clear ALL databases (use with extreme caution!)
redis-cli flushall
```

### Performance Issues

**1. Check Redis memory:**

```bash
redis-cli info memory
```

**2. Check slow operations:**

```bash
redis-cli slowlog get 10
```

**3. Monitor connection count:**

```bash
redis-cli client list
```

### Common Issues

**Issue: "Connection refused"**

- Ensure Redis is running: `redis-server --version`
- Check Redis is listening: `netstat -an | grep 6379`
- Verify firewall rules

**Issue: "Authentication failed"**

- Check REDIS_URL contains correct password
- Verify Redis requirepass configuration

**Issue: "Cache not persisting between restarts"**

- This is normal! Cache is meant to be ephemeral
- If you need persistence, that's what your database is for
- Check Redis is using the correct database number

**Issue: "Keys not showing in Redis"**

- Remember keys are prefixed with `cache:`
- Use: `redis-cli keys "cache:*"` not `redis-cli keys "*"`

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
- [Keyv Nestjs Caching Documentation](https://keyv.org/docs/caching/caching-nestjs/)
- [Keyv Redis Npm Documentation](https://www.npmjs.com/package/@keyv/redis#using-cacheable-with-redis)
