import {
  BooleanFieldOptional,
  StringFieldOptional,
  TextAreaFieldOptional,
} from '../../../decorators/field.decorators.ts';

export class UpdatePermissionDto {
  @StringFieldOptional({ maxLength: 100 })
  slug?: string;

  @TextAreaFieldOptional()
  description?: string;

  @BooleanFieldOptional()
  isActive?: boolean;
}
