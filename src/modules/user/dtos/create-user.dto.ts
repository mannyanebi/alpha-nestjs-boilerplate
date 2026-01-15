import {
  EmailField,
  EnumField,
  PhoneFieldOptional,
  StringField,
} from '../../../decorators/field.decorators.ts';
import { RoleType } from '../../rbac/constants/roles.constant';

export class CreateUserDto {
  @StringField()
  firstName!: string;

  @StringField()
  lastName!: string;

  @EmailField()
  email!: string;

  @PhoneFieldOptional()
  phone!: string;

  @EnumField(() => RoleType)
  role!: RoleType;
}
