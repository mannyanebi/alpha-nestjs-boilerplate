import { StringField } from '../../../decorators/field.decorators.ts';

export class AssignPermissionsDto {
  @StringField({ each: true, minLength: 1 })
  permissions!: string[];
}
