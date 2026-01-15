import {
  BooleanFieldOptional,
  StringField,
  TextAreaFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class CreatePermissionDto {
  @StringField({ maxLength: 100 })
  slug!: string;

  @TextAreaFieldOptional()
  description?: string;

  @BooleanFieldOptional()
  isActive?: boolean;
}
