import { MinLength } from 'class-validator';

import {
  EmailField,
  StringField,
} from '../../../decorators/field.decorators.ts';
import { Match } from '../../../decorators/validator.decorators.ts';

export class ResetPasswordDto {
  @EmailField()
  email!: string;

  @StringField({ maxLength: 4, minLength: 4 })
  otpCode!: string;

  @StringField({ minLength: 10 })
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  newPassword!: string;

  @StringField()
  @Match('newPassword', { message: 'Passwords do not match' })
  confirmPassword!: string;
}
