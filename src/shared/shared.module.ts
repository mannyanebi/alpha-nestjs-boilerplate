import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import type { Provider } from '@nestjs/common';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ApiConfigService } from './services/api-config.service.ts';
import { AwsS3Service } from './services/aws-s3.service.ts';
import { GeneratorService } from './services/generator.service.ts';
import { MailerModule } from './services/mailer/mailer.module.ts';
import { RedisService } from './services/redis.service.ts';
import { TranslationService } from './services/translation.service.ts';
import { ValidatorService } from './services/validator.service.ts';

const providers: Provider[] = [
  ApiConfigService,
  ValidatorService,
  AwsS3Service,
  GeneratorService,
  TranslationService,
  RedisService,
];

@Global()
@Module({
  providers,
  imports: [
    CqrsModule,
    MailerModule,
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

        // Create KeyvRedis store (NestJS will wrap it in Keyv internally)
        const store = new KeyvRedis(connectionString);

        return {
          stores: [store],
          ttl: 30 * 60 * 1000, // 30 minutes in milliseconds
        };
      },
      inject: [ApiConfigService],
    }),
  ],
  exports: [...providers, CqrsModule, MailerModule, CacheModule],
})
export class SharedModule {}
