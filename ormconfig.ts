import './src/boilerplate.polyfill';

import dotenv from 'dotenv';
import fs from 'fs';
import { DataSource } from 'typeorm';

import { UserSubscriber } from './src/entity-subscribers/user-subscriber';
import { SnakeNamingStrategy } from './src/snake-naming.strategy';

dotenv.config();

// Debug environment variables

const sslConfig =
  process.env.DB_SSL_ENABLED === 'true'
    ? {
        rejectUnauthorized: true,
        ca: fs.readFileSync('./ca-certificate.crt').toString(),
      }
    : false;

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: sslConfig,
  namingStrategy: new SnakeNamingStrategy(),
  subscribers: [UserSubscriber],
  entities: [
    'src/modules/**/*.entity{.ts,.js}',
    'src/modules/**/*.view-entity{.ts,.js}',
  ],
  migrations: ['src/database/migrations/*{.ts,.js}'],
});

console.log('🚀 DataSource SSL Config:', dataSource.options.ssl);
