import { SetMetadata } from '@nestjs/common';

import type {
  AuditAction,
  EntityType,
} from '../constants/audit-actions.constant.ts';

export interface IAuditLogOptions {
  action: AuditAction;
  entityType: EntityType;
  entityIdParam?: string; // Which parameter contains the entity ID
  captureBody?: boolean; // Capture request body as new_values
  captureOldValues?: boolean; // Fetch old values before update
  message?: string;
}

export const AUDIT_LOG_KEY = 'audit_log';

export const AuditLog = (options: IAuditLogOptions) =>
  SetMetadata(AUDIT_LOG_KEY, options);
