import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { GeneratorProvider } from '../../providers/generator.provider.ts';
import type { FindOptionsWhere } from 'typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
// import { FileNotImageException } from '../../exceptions/file-not-image.exception.ts';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception.ts';
// import type { IFile } from '../../interfaces/IFile.ts';
// import { AwsS3Service } from '../../shared/services/aws-s3.service.ts';
// import type { MailerService } from '../../shared/services/mailer/mailer.service.ts';
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
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    // private validatorService: ValidatorService,
    // private awsS3Service: AwsS3Service,
    private commandBus: CommandBus,
    //private mailerService: MailerService,
  ) {}

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
    console.log(
      '🚀 ~ UserService ~ createRoleBasedUser ~ plainPassword:',
      plainPassword,
    );
    user.password = plainPassword;

    await this.userRepository.save(user);

    user.settings = await this.createSettings(
      user.id,
      plainToClass(CreateSettingsDto, {
        isEmailVerified: false,
        isPhoneVerified: false,
      }),
    );

    //     // Send welcome email
    //     await this.mailerService.sendMail({
    //       to: user.email!,
    //       subject: 'Test Email',
    //       text: `Hello ${user.firstName}, your account has been created. Your password is: ${plainPassword}`,
    //     });
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
}
