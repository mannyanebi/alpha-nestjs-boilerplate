import { IsEmail, IsEnum, IsPhoneNumber, IsString } from 'class-validator';

import { RoleType } from '../../rbac/constants/roles.constant';

export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsPhoneNumber()
  phone!: string;

  @IsEnum(RoleType)
  role!: RoleType;
}
