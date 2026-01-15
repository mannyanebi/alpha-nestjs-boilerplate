import { NotFoundException } from '@nestjs/common';

export class PermissionNotFoundException extends NotFoundException {
  constructor(error?: string) {
    super('error.permissionNotFound', error);
  }
}
