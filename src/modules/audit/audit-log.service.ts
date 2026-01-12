import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogEntity } from './audit-log.entity.ts';
import type {
  AuditAction,
  EntityType,
} from './constants/audit-actions.constant.ts';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  async create(data: Partial<AuditLogEntity>): Promise<void> {
    try {
      await this.auditLogRepository.save(data);
    } catch (error) {
      // Never let audit logging break the main flow
      console.error('Failed to create audit log:', error);
    }
  }

  // Helper for manual logging with diff calculation
  async logUpdate<T extends Record<string, unknown>>(options: {
    userId: string | null;
    action: AuditAction;
    entityType: EntityType;
    entityId: string;
    oldEntity: T;
    updatedEntity: T;
    ipAddress?: string;
    source?: string;
    userAgent?: string;
  }): Promise<void> {
    const diff = this.calculateDiff(options.oldEntity, options.updatedEntity);

    await this.create({
      userId: options.userId,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      oldValues: diff.old,
      updatedValues: diff.changed,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      source: options.source ?? 'system',
      status: 'success',
    });
  }

  private calculateDiff<T extends Record<string, unknown>>(
    oldEntity: T,
    updatedEntity: T,
  ): { old: Record<string, unknown>; changed: Record<string, unknown> } {
    const old: Record<string, unknown> = {};
    const changed: Record<string, unknown> = {};

    for (const key of Object.keys(updatedEntity)) {
      if (oldEntity[key] !== updatedEntity[key]) {
        old[key] = oldEntity[key];
        changed[key] = updatedEntity[key];
      }
    }

    return { old, changed };
  }

  // System-level logging without user
  async logSystemAction(
    action: AuditAction,
    entityType: EntityType,
    entityId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      userId: null,
      action,
      entityType,
      entityId,
      source: 'system',
      status: 'success',
      metadata,
    });
  }

  // Query audit logs with filters
  async findLogs(options: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<[AuditLogEntity[], number]> {
    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (options.userId) {
      query.andWhere('audit.userId = :userId', { userId: options.userId });
    }

    if (options.entityType) {
      query.andWhere('audit.entityType = :entityType', {
        entityType: options.entityType,
      });
    }

    if (options.entityId) {
      query.andWhere('audit.entityId = :entityId', {
        entityId: options.entityId,
      });
    }

    if (options.action) {
      query.andWhere('audit.action = :action', { action: options.action });
    }

    if (options.startDate) {
      query.andWhere('audit.timestamp >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      query.andWhere('audit.timestamp <= :endDate', {
        endDate: options.endDate,
      });
    }

    query.orderBy('audit.timestamp', 'DESC');
    query.limit(options.limit ?? 50);
    query.offset(options.offset ?? 0);

    return query.getManyAndCount();
  }
}
