import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { generateHash } from '../../common/utils.ts';
import { RoleType } from '../../modules/rbac/constants/roles.constant.ts';
import { RoleEntity } from '../../modules/rbac/entities/role.entity.ts';
import { seedRbacData } from '../../modules/rbac/seeders/seed-rbac.ts';
import { UserEntity } from '../../modules/user/user.entity.ts';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private configService: ConfigService,
  ) {}

  async seed(): Promise<void> {
    // Check if seeding is enabled
    const isAutoSeedEnabled = this.configService.get<boolean>(
      'ENABLE_AUTO_SEED',
      false,
    );
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (nodeEnv !== 'development') {
      this.logger.debug('Seeding skipped: Not in development environment');

      return;
    }

    if (!isAutoSeedEnabled) {
      this.logger.debug('Seeding skipped: ENABLE_AUTO_SEED is false');

      return;
    }

    this.logger.log('🌱 Starting development database seeding...');

    try {
      // Seed RBAC data
      await this.seedRbac();

      // Seed Super Admin user
      await this.seedSuperAdmin();

      this.logger.log('✅ Database seeding completed successfully');
    } catch (error) {
      this.logger.error('❌ Database seeding failed:', error);

      throw error;
    }
  }

  private async seedRbac(): Promise<void> {
    // Check if RBAC data already exists
    const superAdminRole = await this.roleRepository.findOne({
      where: { name: RoleType.SUPER_ADMIN },
    });

    if (superAdminRole) {
      this.logger.log('ℹ️  RBAC data already exists, skipping RBAC seeding');

      return;
    }

    this.logger.log('🔐 Seeding RBAC data (roles & permissions)...');

    const dataSource = this.roleRepository.manager.connection;
    await seedRbacData(dataSource);

    this.logger.log('✅ RBAC data seeded successfully');
  }

  private async seedSuperAdmin(): Promise<void> {
    const adminEmail = this.configService.get<string>(
      'DEV_ADMIN_EMAIL',
      'admin@croptera.local',
    );

    // Check if Super Admin user already exists
    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      this.logger.log(
        `ℹ️  Super Admin user (${adminEmail}) already exists, skipping user seeding`,
      );

      return;
    }

    this.logger.log(`👤 Creating Super Admin user (${adminEmail})...`);

    const adminPassword = this.configService.get<string>(
      'DEV_ADMIN_PASSWORD',
      'Pa$$w0rd!',
    );
    const adminFirstName = this.configService.get<string>(
      'DEV_ADMIN_FIRST_NAME',
      'Super',
    );
    const adminLastName = this.configService.get<string>(
      'DEV_ADMIN_LAST_NAME',
      'Admin',
    );

    const hashedPassword = generateHash(adminPassword);

    const superAdmin = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: RoleType.SUPER_ADMIN,
    });

    await this.userRepository.save(superAdmin);

    this.logger.log(`✅ Super Admin user created successfully (${adminEmail})`);
  }
}
