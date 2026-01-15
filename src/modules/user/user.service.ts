import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import Mailgen from 'mailgen';
import type { FindOptionsWhere } from 'typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import type { PageDto } from '../../common/dto/page.dto.ts';
import { validateHash } from '../../common/utils.ts';
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
import type { ResetPasswordDto } from './dtos/reset-password.dto.ts';
import type { SetPasswordDto } from './dtos/set-password.dto.ts';
import type { UserDto } from './dtos/user.dto.ts';
import type { UsersPageOptionsDto } from './dtos/users-page-options.dto.ts';
import { PasswordResetTokenEntity } from './password-reset-token.entity.ts';
import { UserEntity } from './user.entity.ts';
import type { UserSettingsEntity } from './user-settings.entity.ts';

@Injectable()
export class UserService {
  private readonly mailGenerator: Mailgen;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private passwordResetTokenRepository: Repository<PasswordResetTokenEntity>,
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

  @Transactional()
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return;
    }

    // Generate 4-digit OTP
    const otpCode = GeneratorProvider.generateVerificationCode();

    // Set expiry to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Create password reset token
    const resetToken = this.passwordResetTokenRepository.create({
      userId: user.id,
      code: otpCode,
      expiresAt,
      isUsed: false,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // Send OTP email
    await this.sendPasswordResetEmail(user, otpCode);
  }

  @Transactional()
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { email, otpCode, newPassword } = resetPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('Invalid email or OTP code');
    }

    // Find valid reset token
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        userId: user.id,
        code: otpCode,
        isUsed: false,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('OTP code has expired');
    }

    // Update password
    user.password = newPassword;

    // Mark token as used
    resetToken.isUsed = true;

    await Promise.all([
      this.userRepository.save(user),
      this.passwordResetTokenRepository.save(resetToken),
    ]);
  }

  @Transactional()
  async setPassword(
    user: UserEntity,
    setPasswordDto: SetPasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = setPasswordDto;
    const isPasswordValid = await validateHash(currentPassword, user.password);

    // Verify current password matches
    if (isPasswordValid === false) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password and mark as set by user
    user.password = newPassword;
    user.hasSetPassword = true;

    await this.userRepository.save(user);
  }

  private async sendPasswordResetEmail(
    user: UserEntity,
    otpCode: string,
  ): Promise<void> {
    const appConfig = this.configService.appConfig;
    const mailerConfig = this.configService.mailerConfig;
    const userName = user.firstName || 'there';

    const email = {
      body: {
        name: userName,
        intro: 'You have requested to reset your password.',
        action: {
          instructions: 'Use this verification code to reset your password:',
          button: {
            color: '#22c55e',
            text: otpCode,
            link: '#',
          },
        },
        outro: [
          'This code will expire in 15 minutes.',
          'If you did not request a password reset, please ignore this email or contact support if you have concerns.',
          mailerConfig.supportEmail
            ? `Need help? Contact us at ${mailerConfig.supportEmail}.`
            : 'Need help? Reply to this email.',
        ],
      },
    };

    const html = this.mailGenerator.generate(email);
    const text = this.mailGenerator.generatePlaintext(email);

    await this.mailerService.sendMail({
      to: user.email!,
      subject: `Password Reset Code - ${appConfig.name}`,
      html,
      text,
    });
  }
}
