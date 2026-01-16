import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { RedisOptions } from 'ioredis';
import Redis from 'ioredis';

import { ApiConfigService } from './api-config.service.ts';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private cacheClient?: Redis;
  private queueClient?: Redis;

  constructor(private configService: ApiConfigService) {}

  /**
   * Parse Redis connection string (redis:// or rediss://)
   * Returns connection options for ioredis
   */
  private parseConnectionString(url: string): RedisOptions {
    try {
      const parsedUrl = new URL(url);
      const isTls = parsedUrl.protocol === 'rediss:';

      const options: RedisOptions = {
        host: parsedUrl.hostname,
        port: Number(parsedUrl.port) || 6379,
        username: parsedUrl.username || undefined,
        password: parsedUrl.password || undefined,
        lazyConnect: false,
        showFriendlyErrorStack: this.configService.isDevelopment,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
      };

      // Add TLS configuration for rediss:// URLs
      if (isTls) {
        options.tls = {
          rejectUnauthorized: false, // As per user requirement
        };
      }

      return options;
    } catch (error) {
      this.logger.error(
        `Failed to parse Redis connection string: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get Redis connection options based on env configuration
   * Prioritizes connection string over individual host/port
   */
  private getConnectionOptions(db: number): RedisOptions {
    const config = this.configService.redisConfig;

    // If URL is provided, parse it
    if (config.url) {
      const options = this.parseConnectionString(config.url);
      options.db = db;
      return options;
    }

    // Fallback to host/port configuration
    return {
      host: config.host,
      port: config.port,
      db,
      lazyConnect: false,
      showFriendlyErrorStack: this.configService.isDevelopment,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    };
  }

  /**
   * Get or create Redis client for cache operations
   */
  getCacheClient(): Redis {
    if (!this.cacheClient) {
      const config = this.configService.redisConfig;

      if (!config.enabled) {
        throw new Error('Redis cache is disabled');
      }

      const options = this.getConnectionOptions(config.cacheDb);
      this.cacheClient = new Redis(options);

      this.cacheClient.on('connect', () => {
        this.logger.log('Redis cache client connected');
      });

      this.cacheClient.on('error', (error) => {
        this.logger.error('Redis cache client error:', error);
      });

      // ✅ Add this debug log to verify connection
      this.cacheClient.on('ready', () => {
        this.logger.log(`Redis cache client ready - DB: ${config.cacheDb}`);
        // Test direct write to Redis
        this.cacheClient?.set(
          'test_direct_redis',
          'direct_write_test',
          'EX',
          60,
        );
        this.logger.log('Direct Redis test key written');
      });
    }

    return this.cacheClient;
  }

  /**
   * Get or create Redis client for queue operations (BullMQ)
   */
  getQueueClient(): Redis {
    if (!this.queueClient) {
      const config = this.configService.redisConfig;

      if (!config.enabled) {
        throw new Error('Redis is not enabled');
      }

      const options = this.getConnectionOptions(config.queueDb);
      this.queueClient = new Redis(options);

      this.queueClient.on('connect', () => {
        this.logger.log('Redis queue client connected');
      });

      this.queueClient.on('error', (error) => {
        this.logger.error('Redis queue client error:', error);
      });

      this.queueClient.on('close', () => {
        this.logger.warn('Redis queue client connection closed');
      });
    }

    return this.queueClient;
  }

  /**
   * Get connection options for BullMQ
   * BullMQ expects connection options, not a client instance
   */
  getQueueConnectionOptions(): RedisOptions {
    const config = this.configService.redisConfig;
    return this.getConnectionOptions(config.queueDb);
  }

  /**
   * Clean up connections on module destroy
   */
  async onModuleDestroy() {
    if (this.cacheClient) {
      await this.cacheClient.quit();
      this.logger.log('Redis cache client disconnected');
    }

    if (this.queueClient) {
      await this.queueClient.quit();
      this.logger.log('Redis queue client disconnected');
    }
  }
}
