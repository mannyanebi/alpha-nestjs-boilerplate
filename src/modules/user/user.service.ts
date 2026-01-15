import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import Mailgen from 'mailgen';
import type { FindOptionsWhere } from 'typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
// import { FileNotImageException } from '../../exceptions/file-not-image.exception.ts';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception.ts';
import { GeneratorProvider } from '../../providers/generator.provider.ts';
// import type { IFile } from '../../interfaces/IFile.ts';
// import { AwsS3Service } from '../../shared/services/aws-s3.service.ts';
import { ApiConfigService } from '../../shared/services/api-config.service.ts';
import { MailerService } from '../../shared/services/mailer/mailer.service.ts';
// import { ValidatorService } from '../../shared/services/validator.service.ts';
// import type { Reference } from '../../types.ts';
import { CreateSettingsCommand } from './commands/create-settings.command.ts';
import { CreateSettingsDto } from './dtos/create-settings.dto.ts';
import type { CreateUserDto } from './dtos/create-user.dto.ts';
import type { UserDto } from './dtos/user.dto.ts';
import type { UsersPageOptionsDto } from './dtos/users-page-options.dto.ts';
import { UserEntity } from './user.entity.ts';
import type { UserSettingsEntity } from './user-settings.entity.ts';

@Injectable()
export class UserService {
  private readonly mailGenerator: Mailgen;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    // private validatorService: ValidatorService,
    // private awsS3Service: AwsS3Service,
    private commandBus: CommandBus,
    private mailerService: MailerService,
    private configService: ApiConfigService,
  ) {
    const appConfig = this.configService.appConfig;
    this.mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: appConfig.name,
        link: appConfig.loginUrl,
      },
    });
  }

  /** Find single user */
  findOne(findData: FindOptionsWhere<UserEntity>): Promise<UserEntity | null> {
    return this.userRepository.findOneBy(findData);
  }

  @Transactional()
  async createUser(
    createUserDto: CreateUserDto,
    // file?: Reference<IFile>,
  ): Promise<UserEntity> {
    const user = this.userRepository.create(createUserDto);

    // if (file) {
    //   if (!this.validatorService.isImage(file.mimetype)) {
    //     throw new FileNotImageException();
    //   }

    //   user.avatar = await this.awsS3Service.uploadImage(file);
    // }

    const plainPassword = GeneratorProvider.generatePassword();

    user.password = plainPassword;
    user.hasSetPassword = false;

    await this.userRepository.save(user);

    user.settings = await this.createSettings(
      user.id,
      plainToClass(CreateSettingsDto, {
        isEmailVerified: false,
        isPhoneVerified: false,
      }),
    );

    // Send welcome email
    await this.sendWelcomeEmail(user, plainPassword);
    return user;
  }

  async getUsers(
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<PageDto<UserDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async getUser(userId: Uuid): Promise<UserDto> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder.where('user.id = :userId', { userId });

    const userEntity = await queryBuilder.getOne();

    if (!userEntity) {
      throw new UserNotFoundException();
    }

    return userEntity.toDto();
  }

  createSettings(
    userId: Uuid,
    createSettingsDto: CreateSettingsDto,
  ): Promise<UserSettingsEntity> {
    return this.commandBus.execute<CreateSettingsCommand, UserSettingsEntity>(
      new CreateSettingsCommand(userId, createSettingsDto),
    );
  }

  private async sendWelcomeEmail(
    user: UserEntity,
    password: string,
  ): Promise<void> {
    const appConfig = this.configService.appConfig;
    const mailerConfig = this.configService.mailerConfig;
    const userName = user.firstName || 'there';

    const email = {
      body: {
        name: userName,
        intro: `Welcome to ${appConfig.name}! Your account has been successfully created.`,
        table: {
          data: [
            {
              item: 'Email',
              description: user.email,
            },
            {
              item: 'Password',
              description: password,
            },
          ],
          columns: {
            customWidth: {
              item: '25%',
              description: '75%',
            },
          },
        },
        action: {
          instructions:
            'Use the credentials above to sign in. Click the button below to access your account:',
          button: {
            color: '#1f2937',
            text: `Sign in to ${appConfig.name}`,
            link: appConfig.loginUrl,
          },
        },
        outro: [
          'This is your current password. For security reasons, we recommend changing it after your first login.',
          'You can update your password at any time from your account settings.',
          mailerConfig.supportEmail
            ? `If you need any assistance, feel free to reach out to us at ${mailerConfig.supportEmail}.`
            : 'If you need any assistance, feel free to reply to this email.',
        ],
      },
    };

    const html = this.mailGenerator.generate(email);
    const text = this.mailGenerator.generatePlaintext(email);

    await this.mailerService.sendMail({
      to: user.email!,
      subject: `Welcome to ${appConfig.name}`,
      html,
      text,
    });
  }
}
