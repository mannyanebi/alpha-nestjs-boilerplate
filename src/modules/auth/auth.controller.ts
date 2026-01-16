import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { ForgotPasswordDto } from '../user/dtos/forgot-password.dto.ts';
import { ResetPasswordDto } from '../user/dtos/reset-password.dto.ts';
import { SetPasswordDto } from '../user/dtos/set-password.dto.ts';
import { UserDto } from '../user/dtos/user.dto.ts';
import { ValidateResetPasswordCodeDto } from '../user/dtos/validate-reset-password-code.dto.ts';
import { UserEntity } from '../user/user.entity.ts';
import { UserService } from '../user/user.service.ts';
import { AuthService } from './auth.service.ts';
import { LoginPayloadDto } from './dto/login-payload.dto.ts';
import { RefreshTokenDto } from './dto/refresh-token.dto.ts';
import { TokenPayloadDto } from './dto/token-payload.dto.ts';
import { UserLoginDto } from './dto/user-login.dto.ts';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token and refresh token',
  })
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<LoginPayloadDto> {
    const userEntity = await this.authService.validateUser(userLoginDto);

    const accessToken = await this.authService.createAccessToken({
      userId: userEntity.id,
      role: userEntity.role,
    });

    const refreshToken = await this.authService.createRefreshToken({
      userId: userEntity.id,
      role: userEntity.role,
    });

    return new LoginPayloadDto(userEntity.toDto(), accessToken, refreshToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: TokenPayloadDto,
    description: 'New access token',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenPayloadDto> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  // @Post('register')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({ type: UserDto, description: 'Successfully Registered' })
  // @ApiFile({ name: 'avatar' })
  // async userRegister(
  //   @Body() userRegisterDto: UserRegisterDto,
  //   @UploadedFile() file?: Reference<IFile>,
  // ): Promise<UserDto> {
  //   const createdUser = await this.userService.createUser(
  //     userRegisterDto,
  //     file,
  //   );

  //   return createdUser.toDto({
  //     isActive: true,
  //   });
  // }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth()
  @ApiOkResponse({ type: UserDto, description: 'current user info' })
  getCurrentUser(@AuthUser() user: UserEntity): UserDto {
    return user.toDto();
  }

  @Post('forgot-password')
  @Auth(undefined, { public: true })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Password reset OTP sent to email',
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.userService.forgotPassword(forgotPasswordDto.email);
    return {
      message:
        'If the email exists, a password reset code has been sent to it.',
    };
  }

  @Post('validate-reset-password-otp')
  @Auth(undefined, { public: true })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'OTP code is valid',
  })
  async validateResetPasswordOtp(
    @Body() validateResetPasswordCodeDto: ValidateResetPasswordCodeDto,
  ): Promise<{ message: string }> {
    const result = await this.userService.validateResetPasswordOtp(
      validateResetPasswordCodeDto.email,
      validateResetPasswordCodeDto.otpCode,
    );

    if (result) {
      return { message: 'OTP code is valid.' };
    } else {
      return { message: 'OTP code is invalid.' };
    }
  }

  @Post('reset-password')
  @Auth(undefined, { public: true })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Password successfully reset',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.userService.resetPassword(resetPasswordDto);
    return { message: 'Password has been successfully reset.' };
  }

  @Post('set-password')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Password successfully updated',
  })
  async setPassword(
    @AuthUser() user: UserEntity,
    @Body() setPasswordDto: SetPasswordDto,
  ): Promise<{ message: string }> {
    await this.userService.setPassword(user, setPasswordDto);
    return { message: 'Password has been successfully updated.' };
  }
}
