import {
  BooleanFieldOptional,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
  TextAreaFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class CreateRoleDto {
  @StringField({ maxLength: 50 })
  name!: string;

  @StringFieldOptional({ maxLength: 100 })
  displayName?: string;

  @TextAreaFieldOptional()
  description?: string;

  @NumberFieldOptional({ int: true, min: 1 })
  hierarchy?: number;

  @BooleanFieldOptional()
  isActive?: boolean;

  @StringFieldOptional({ each: true, minLength: 1 })
  permissions?: string[];
}
