import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Version,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '../../decorators/auth-user.decorator.ts';
import { Auth } from '../../decorators/http.decorators.ts';
import { RoleType } from '../rbac/constants/roles.constant.ts';
import { UserDto } from '../user/dtos/user.dto.ts';
import { UserEntity } from '../user/user.entity.ts';
// import { UserService } from '../user/user.service.ts';
import { AuthService } from './auth.service.ts';
import { LoginPayloadDto } from './dto/login-payload.dto.ts';
import { RefreshTokenDto } from './dto/refresh-token.dto.ts';
import { TokenPayloadDto } from './dto/token-payload.dto.ts';
import { UserLoginDto } from './dto/user-login.dto.ts';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    // private userService: UserService,
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

  @Version('1')
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([
    RoleType.AGRONOMIST,
    RoleType.MEAL,
    RoleType.SENIOR_AGRONOMIST,
    RoleType.SUPER_ADMIN,
  ])
  @ApiOkResponse({ type: UserDto, description: 'current user info' })
  getCurrentUser(@AuthUser() user: UserEntity): UserDto {
    return user.toDto();
  }
}
