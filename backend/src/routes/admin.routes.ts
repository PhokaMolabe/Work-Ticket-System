import { Router } from 'express';
import { SelectQueryBuilder } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../config/data-source';
import { AuditLog } from '../entities/AuditLog';
import { asyncHandler } from '../middleware/async-handler';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { UserRole } from '../constants/roles';
import { getPagination } from '../utils/pagination';

const router = Router();

router.use(authenticate, requireRoles(UserRole.ADMIN));

const logQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  actorUserId: z.string().uuid().optional(),
  action: z.string().max(80).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});

const exportSchema = logQuerySchema.extend({
  format: z.enum(['json', 'csv']).default('json')
});

const applyLogFilters = (
  qb: SelectQueryBuilder<AuditLog>,
  params: z.infer<typeof logQuerySchema>
) => {
  if (params.actorUserId) {
    qb.andWhere('audit.actorUserId = :actorUserId', { actorUserId: params.actorUserId });
  }

  if (params.action) {
    qb.andWhere('audit.action = :action', { action: params.action });
  }

  if (params.dateFrom) {
    qb.andWhere('audit.createdAt >= :dateFrom', { dateFrom: params.dateFrom });
  }

  if (params.dateTo) {
    qb.andWhere('audit.createdAt <= :dateTo', { dateTo: params.dateTo });
  }
};

router.get(
  '/audit-logs',
  validate(logQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof logQuerySchema>;
    const pagination = getPagination(String(query.page), String(query.pageSize));

    const qb = AppDataSource.getRepository(AuditLog).createQueryBuilder('audit');
    applyLogFilters(qb, query);

    qb.orderBy('audit.createdAt', 'DESC').skip(pagination.skip).take(pagination.pageSize);

    const [rows, total] = await qb.getManyAndCount();

    res.json({
      data: rows,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize)
      }
    });
  })
);

const csvEscape = (value: unknown): string => {
  const text = String(value ?? '');
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
};

router.get(
  '/audit-logs/export',
  validate(exportSchema, 'query'),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof exportSchema>;
    const qb = AppDataSource.getRepository(AuditLog).createQueryBuilder('audit');
    applyLogFilters(qb, query);

    qb.orderBy('audit.createdAt', 'DESC').take(5000);

    const rows = await qb.getMany();

    if (query.format === 'csv') {
      const headers = [
        'id',
        'createdAt',
        'actorUserId',
        'actorRole',
        'action',
        'resourceType',
        'resourceId',
        'metadata',
        'ipAddress',
        'userAgent'
      ];

      const csv = [
        headers.join(','),
        ...rows.map((row) =>
          [
            row.id,
            row.createdAt.toISOString(),
            row.actorUserId,
            row.actorRole,
            row.action,
            row.resourceType,
            row.resourceId,
            JSON.stringify(row.metadata ?? {}),
            row.ipAddress,
            row.userAgent
          ]
            .map(csvEscape)
            .join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
    return res.send(JSON.stringify(rows, null, 2));
  })
);

export default router;
