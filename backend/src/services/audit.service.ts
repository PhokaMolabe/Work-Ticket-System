import { EntityManager } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '../config/data-source';
import { AuditLog } from '../entities/AuditLog';
import { UserRole } from '../constants/roles';
import { sanitizeMetadata } from '../utils/sanitize-metadata';

interface AuditParams {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  actorUserId?: string | null;
  actorRole?: UserRole | null;
  metadata?: Record<string, unknown>;
  req?: Request;
  manager?: EntityManager;
}

const extractIp = (req?: Request): string | null => {
  if (!req) {
    return null;
  }

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip ?? null;
};

export const writeAuditLog = async ({
  action,
  resourceType,
  resourceId,
  actorUserId,
  actorRole,
  metadata,
  req,
  manager
}: AuditParams): Promise<void> => {
  const repository = manager
    ? manager.getRepository(AuditLog)
    : AppDataSource.getRepository(AuditLog);

  const record = repository.create({
    action,
    resourceType,
    resourceId: resourceId ?? null,
    actorUserId: actorUserId ?? null,
    actorRole: actorRole ?? null,
    metadata: sanitizeMetadata(metadata),
    ipAddress: extractIp(req),
    userAgent: req?.headers['user-agent'] ?? null
  });

  await repository.save(record);
};
