import { NotFoundException } from '@nestjs/common';

export class RoleNotFoundException extends NotFoundException {
  constructor(error?: string) {
    super('error.roleNotFound', error);
  }
}
