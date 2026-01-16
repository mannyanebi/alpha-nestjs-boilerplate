import {
  EmailField,
  StringField,
} from '../../../decorators/field.decorators.ts';

export class ValidateResetPasswordCodeDto {
  @EmailField()
  email!: string;

  @StringField({ maxLength: 4, minLength: 4 })
  otpCode!: string;
}
