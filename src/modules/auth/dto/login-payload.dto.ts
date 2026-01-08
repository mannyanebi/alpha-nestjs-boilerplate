import { ClassField } from '../../../decorators/field.decorators.ts';
import { UserDto } from '../../user/dtos/user.dto.ts';
import { TokenPayloadDto } from './token-payload.dto.ts';

export class LoginPayloadDto {
  @ClassField(() => UserDto)
  user: UserDto;

  @ClassField(() => TokenPayloadDto)
  accessToken: TokenPayloadDto;

  @ClassField(() => TokenPayloadDto)
  refreshToken: TokenPayloadDto;

  constructor(
    user: UserDto,
    accessToken: TokenPayloadDto,
    refreshToken: TokenPayloadDto,
  ) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
