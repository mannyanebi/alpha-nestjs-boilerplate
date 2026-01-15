import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// import { SharedModule } from '../../shared/shared.module.ts';
import { AwsS3Service } from '../../shared/services/aws-s3.service';
import { MailerModule } from '../../shared/services/mailer/mailer.module.ts';
// import { MailerService } from '../../shared/services/mailer/mailer.service';
import { ValidatorService } from '../../shared/services/validator.service';
import { CreateSettingsHandler } from './commands/create-settings.command';
import { UserController } from './user.controller.ts';
import { UserEntity } from './user.entity.ts';
import { UserService } from './user.service.ts';
import { UserSettingsEntity } from './user-settings.entity.ts';

const handlers = [CreateSettingsHandler];

@Module({
  imports: [
    MailerModule,
    // SharedModule,
    TypeOrmModule.forFeature([UserEntity, UserSettingsEntity]),
  ],
  controllers: [UserController],
  providers: [AwsS3Service, ValidatorService, UserService, ...handlers],
  exports: [UserService],
})
export class UserModule {}
