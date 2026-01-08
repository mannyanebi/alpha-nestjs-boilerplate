import { StringField } from '../../../decorators/field.decorators.ts';

export class RefreshTokenDto {
  @StringField()
  refreshToken!: string;
}
