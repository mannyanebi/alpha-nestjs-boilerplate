import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoleEntity } from '../modules/rbac/entities/role.entity.ts';
import { UserEntity } from '../modules/user/user.entity.ts';
import { SeederService } from './services/seeder.service.ts';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([RoleEntity, UserEntity])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
