import fs from 'fs';
import { Router } from 'express';
import { Brackets } from 'typeorm';
import { z } from 'zod';
import { AppDataSource } from '../config/data-source';
import { UserRole } from '../constants/roles';
import { TicketPriority, TicketStatus } from '../constants/ticket';
import { AUDIT_ACTIONS } from '../constants/audit';
import { Ticket } from '../entities/Ticket';
import { User } from '../entities/User';
import { Comment } from '../entities/Comment';
import { Evidence } from '../entities/Evidence';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../middleware/async-handler';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { writeAuditLog } from '../services/audit.service';
import {
  assertCanModifyTicket,
  assertCanParticipateOnTicket,
  assertCanViewTicket,
  validateTransitionOrThrow
} from '../services/ticket.service';
import { getPagination } from '../utils/pagination';
import { serializeComment, serializeEvidence, serializeTicket } from '../utils/serializers';
import { computeDueAt } from '../utils/sla';

const router = Router();

router.use(authenticate);

const createTicketSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(5).max(5000),
  priority: z.nativeEnum(TicketPriority)
});

const updateTicketSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(5).max(5000).optional(),
    priority: z.nativeEnum(TicketPriority).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });

const updateStatusSchema = z.object({
  status: z.nativeEnum(TicketStatus)
});

const assignTicketSchema = z.object({
  assignedToUserId: z.string().uuid().nullable()
});

const commentSchema = z.object({
  body: z.string().min(1).max(5000)
});

const listTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  search: z.string().max(200).optional(),
  assigned: z.enum(['assigned', 'unassigned', 'mine']).optional(),
  sortBy: z.enum(['createdAt', 'dueAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC')
});

const queueQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigned: z.enum(['assigned', 'unassigned', 'mine']).optional(),
  search: z.string().max(200).optional()
});

const getTicketByIdOrThrow = async (ticketId: string) => {
  const ticket = await AppDataSource.getRepository(Ticket).findOne({
    where: { id: ticketId },
    relations: {
      createdBy: true,
      assignedTo: true,
      evidence: true
    }
  });

  if (!ticket) {
    throw new AppError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
  }

  return ticket;
};

const applyPrioritySort = (alias: string): string => {
  return `CASE
    WHEN ${alias}.priority = 'URGENT' THEN 1
    WHEN ${alias}.priority = 'HIGH' THEN 2
    WHEN ${alias}.priority = 'MEDIUM' THEN 3
    WHEN ${alias}.priority = 'LOW' THEN 4
    ELSE 5
  END`;
};

router.post(
  '/',
  validate(createTicketSchema),
  asyncHandler(async (req, res) => {
    const actor = req.user!;

    if (![UserRole.REQUESTER, UserRole.ADMIN].includes(actor.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Only requester and admin can create tickets');
    }

    const { title, description, priority } = req.body;

    let savedTicketId = '';
    await AppDataSource.transaction(async (manager) => {
      const ticketRepo = manager.getRepository(Ticket);

      const ticket = ticketRepo.create({
        title,
        description,
        priority,
        status: TicketStatus.OPEN,
        createdByUserId: actor.id,
        assignedToUserId: null,
        dueAt: computeDueAt(priority)
      });

      const saved = await ticketRepo.save(ticket);
      savedTicketId = saved.id;

      await writeAuditLog({
        action: AUDIT_ACTIONS.TICKET_CREATED,
        resourceType: 'TICKET',
        resourceId: saved.id,
        actorUserId: actor.id,
        actorRole: actor.role,
        metadata: { title: saved.title, priority: saved.priority },
        req,
        manager
      });
    });

    const responseTicket = await getTicketByIdOrThrow(savedTicketId);

    res.status(201).json({
      data: {
        ...serializeTicket(responseTicket, actor),
        evidence: responseTicket.evidence.map(serializeEvidence)
      }
    });
  })
);

router.get(
  '/',
  validate(listTicketsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const parsedQuery = req.query as unknown as z.infer<typeof listTicketsQuerySchema>;
    const { page, pageSize, status, priority, search, assigned, sortBy, sortOrder } = parsedQuery;
    const pagination = getPagination(String(page), String(pageSize));

    const qb = AppDataSource.getRepository(Ticket)
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo');
    qb.where('1=1');

    if (actor.role === UserRole.REQUESTER) {
      qb.andWhere('ticket.createdByUserId = :userId', { userId: actor.id });
    } else if (actor.role === UserRole.AGENT) {
      qb.andWhere('(ticket.assignedToUserId = :userId OR ticket.assignedToUserId IS NULL)', {
        userId: actor.id
      });

      if (assigned === 'assigned' || assigned === 'mine') {
        qb.andWhere('ticket.assignedToUserId = :assignedUser', { assignedUser: actor.id });
      }
      if (assigned === 'unassigned') {
        qb.andWhere('ticket.assignedToUserId IS NULL');
      }
    }

    if (actor.role === UserRole.ADMIN && assigned) {
      if (assigned === 'assigned') {
        qb.andWhere('ticket.assignedToUserId IS NOT NULL');
      } else if (assigned === 'unassigned') {
        qb.andWhere('ticket.assignedToUserId IS NULL');
      }
    }

    if (status) {
      qb.andWhere('ticket.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('ticket.priority = :priority', { priority });
    }

    if (search) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('LOWER(ticket.title) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('LOWER(ticket.description) LIKE LOWER(:search)', { search: `%${search}%` });
        })
      );
    }

    if (sortBy === 'priority') {
      qb.addSelect(applyPrioritySort('ticket'), 'priority_order');
      qb.orderBy('priority_order', sortOrder);
    } else {
      qb.orderBy(`ticket.${sortBy}`, sortOrder);
    }
    qb.addOrderBy('ticket.createdAt', 'DESC');

    qb.skip(pagination.skip).take(pagination.pageSize);

    const [tickets, total] = await qb.getManyAndCount();

    res.json({
      data: tickets.map((ticket) => serializeTicket(ticket, actor)),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize)
      }
    });
  })
);

router.get(
  '/queue',
  validate(queueQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    if (![UserRole.AGENT, UserRole.ADMIN].includes(actor.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Only agent and admin can access queue');
    }

    const parsedQuery = req.query as unknown as z.infer<typeof queueQuerySchema>;
    const { page, pageSize, status, priority, assigned, search } = parsedQuery;
    const pagination = getPagination(String(page), String(pageSize));

    const qb = AppDataSource.getRepository(Ticket)
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assignedTo', 'assignedTo');
    qb.where('1=1');

    if (actor.role === UserRole.AGENT) {
      qb.andWhere('(ticket.assignedToUserId = :userId OR ticket.assignedToUserId IS NULL)', {
        userId: actor.id
      });

      if (assigned === 'assigned' || assigned === 'mine') {
        qb.andWhere('ticket.assignedToUserId = :mine', { mine: actor.id });
      }
      if (assigned === 'unassigned') {
        qb.andWhere('ticket.assignedToUserId IS NULL');
      }
    }

    if (actor.role === UserRole.ADMIN) {
      if (assigned === 'assigned') {
        qb.andWhere('ticket.assignedToUserId IS NOT NULL');
      }
      if (assigned === 'mine') {
        qb.andWhere('ticket.assignedToUserId = :mine', { mine: actor.id });
      }
      if (assigned === 'unassigned') {
        qb.andWhere('ticket.assignedToUserId IS NULL');
      }
    }

    if (status) {
      qb.andWhere('ticket.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('ticket.priority = :priority', { priority });
    }

    if (search) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('LOWER(ticket.title) LIKE LOWER(:search)', { search: `%${search}%` })
            .orWhere('LOWER(ticket.description) LIKE LOWER(:search)', { search: `%${search}%` });
        })
      );
    }

    qb.addSelect(applyPrioritySort('ticket'), 'priority_order')
      .orderBy('priority_order', 'ASC')
      .addOrderBy('ticket.dueAt', 'ASC')
      .addOrderBy('ticket.createdAt', 'DESC');

    qb.skip(pagination.skip).take(pagination.pageSize);

    const [tickets, total] = await qb.getManyAndCount();

    res.json({
      data: tickets.map((ticket) => serializeTicket(ticket, actor)),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize)
      }
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const ticket = await getTicketByIdOrThrow(req.params.id);

    assertCanViewTicket(ticket, actor);

    res.json({
      data: {
        ...serializeTicket(ticket, actor),
        evidence: ticket.evidence.map(serializeEvidence)
      }
    });
  })
);

router.patch(
  '/:id',
  validate(updateTicketSchema),
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const updates = req.body;
    const ticket = await getTicketByIdOrThrow(req.params.id);

    assertCanModifyTicket(ticket, actor);

    if (actor.role === UserRole.REQUESTER && updates.priority) {
      throw new AppError(403, 'FORBIDDEN', 'Requester cannot change ticket priority after creation');
    }

    if (actor.role === UserRole.AGENT && updates.title) {
      throw new AppError(403, 'FORBIDDEN', 'Agent cannot update ticket title');
    }

    await AppDataSource.transaction(async (manager) => {
      const ticketRepo = manager.getRepository(Ticket);
      await ticketRepo.update(ticket.id, updates);

      await writeAuditLog({
        action: AUDIT_ACTIONS.TICKET_UPDATED,
        resourceType: 'TICKET',
        resourceId: ticket.id,
        actorUserId: actor.id,
        actorRole: actor.role,
        metadata: { updatedFields: Object.keys(updates) },
        req,
        manager
      });
    });

    const updated = await getTicketByIdOrThrow(ticket.id);

    res.json({
      data: serializeTicket(updated, actor)
    });
  })
);

router.patch(
  '/:id/assign',
  validate(assignTicketSchema),
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const { assignedToUserId } = req.body;

    if (![UserRole.ADMIN, UserRole.AGENT].includes(actor.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Only admin and agent can assign tickets');
    }

    const ticket = await getTicketByIdOrThrow(req.params.id);

    let nextAssigneeId: string | null = assignedToUserId;

    if (actor.role === UserRole.AGENT && !actor.isLead) {
      if (ticket.assignedToUserId !== null || assignedToUserId !== actor.id) {
        throw new AppError(
          403,
          'ASSIGNMENT_FORBIDDEN',
          'Non-lead agents can only assign unassigned tickets to themselves'
        );
      }
    }

    if (nextAssigneeId) {
      const assignee = await AppDataSource.getRepository(User).findOne({ where: { id: nextAssigneeId } });

      if (!assignee || assignee.role !== UserRole.AGENT) {
        throw new AppError(400, 'INVALID_ASSIGNEE', 'Assigned user must be an AGENT account');
      }
    }

    if (nextAssigneeId === undefined) {
      nextAssigneeId = null;
    }

    const previousAssigneeId = ticket.assignedToUserId;

    await AppDataSource.transaction(async (manager) => {
      const ticketRepo = manager.getRepository(Ticket);
      await ticketRepo.update(ticket.id, { assignedToUserId: nextAssigneeId });

      await writeAuditLog({
        action: AUDIT_ACTIONS.TICKET_ASSIGNED,
        resourceType: 'TICKET',
        resourceId: ticket.id,
        actorUserId: actor.id,
        actorRole: actor.role,
        metadata: { previousAssigneeId, nextAssigneeId },
        req,
        manager
      });
    });

    const updated = await getTicketByIdOrThrow(ticket.id);

    res.json({
      data: serializeTicket(updated, actor)
    });
  })
);

router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const { status } = req.body;
    const ticket = await getTicketByIdOrThrow(req.params.id);

    if (actor.role === UserRole.REQUESTER && ticket.createdByUserId !== actor.id) {
      throw new AppError(404, 'TICKET_NOT_FOUND', 'Ticket not found');
    }

    if (actor.role === UserRole.AGENT && ticket.assignedToUserId !== actor.id) {
      throw new AppError(403, 'FORBIDDEN', 'Agent can only update status of assigned tickets');
    }

    validateTransitionOrThrow(ticket.status, status, actor);

    const previousStatus = ticket.status;

    await AppDataSource.transaction(async (manager) => {
      const ticketRepo = manager.getRepository(Ticket);
      await ticketRepo.update(ticket.id, { status });

      await writeAuditLog({
        action: AUDIT_ACTIONS.TICKET_STATUS_CHANGED,
        resourceType: 'TICKET',
        resourceId: ticket.id,
        actorUserId: actor.id,
        actorRole: actor.role,
        metadata: { previousStatus, nextStatus: status },
        req,
        manager
      });
    });

    const updated = await getTicketByIdOrThrow(ticket.id);

    res.json({
      data: serializeTicket(updated, actor)
    });
  })
);

router.post(
  '/:id/comments',
  validate(commentSchema),
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const ticket = await getTicketByIdOrThrow(req.params.id);

    assertCanParticipateOnTicket(ticket, actor);

    const { body } = req.body;

    let savedCommentId = '';
    await AppDataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(Comment);
      const comment = commentRepo.create({
        ticketId: ticket.id,
        userId: actor.id,
        body
      });

      const saved = await commentRepo.save(comment);
      savedCommentId = saved.id;

      await writeAuditLog({
        action: AUDIT_ACTIONS.COMMENT_ADDED,
        resourceType: 'TICKET',
        resourceId: ticket.id,
        actorUserId: actor.id,
        actorRole: actor.role,
        metadata: { commentId: saved.id },
        req,
        manager
      });
    });

    const savedComment = await AppDataSource.getRepository(Comment).findOne({
      where: { id: savedCommentId },
      relations: {
        author: true
      }
    });

    res.status(201).json({
      data: savedComment ? serializeComment(savedComment) : null
    });
  })
);

router.get(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const ticket = await getTicketByIdOrThrow(req.params.id);

    assertCanViewTicket(ticket, actor);

    const comments = await AppDataSource.getRepository(Comment).find({
      where: { ticketId: ticket.id },
      relations: { author: true },
      order: { createdAt: 'ASC' }
    });

    res.json({
      data: comments.map(serializeComment)
    });
  })
);

router.post(
  '/:id/evidence',
  uploadMiddleware.single('file'),
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const ticket = await getTicketByIdOrThrow(req.params.id);

    assertCanParticipateOnTicket(ticket, actor);

    const uploaded = req.file;
    if (!uploaded) {
      throw new AppError(400, 'VALIDATION_ERROR', 'File is required');
    }

    let evidenceId = '';

    await AppDataSource.transaction(async (manager) => {
      const evidenceRepo = manager.getRepository(Evidence);
      const evidence = evidenceRepo.create({
        ticketId: ticket.id,
        uploadedByUserId: actor.id,
        filename: uploaded.originalname,
        storedFilename: uploaded.filename,
        filePath: uploaded.path,
        mimeType: uploaded.mimetype || 'application/octet-stream',
        size: uploaded.size
      });

      const saved = await evidenceRepo.save(evidence);
      evidenceId = saved.id;

      await writeAuditLog({
        action: AUDIT_ACTIONS.EVIDENCE_UPLOADED,
        resourceType: 'TICKET',
        resourceId: ticket.id,
        actorUserId: actor.id,
        actorRole: actor.role,
        metadata: { evidenceId: saved.id, filename: saved.filename },
        req,
        manager
      });
    });

    const evidenceRecord = await AppDataSource.getRepository(Evidence).findOne({ where: { id: evidenceId } });

    res.status(201).json({
      data: evidenceRecord ? serializeEvidence(evidenceRecord) : null
    });
  })
);

router.get(
  '/:id/evidence',
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const ticket = await getTicketByIdOrThrow(req.params.id);

    assertCanParticipateOnTicket(ticket, actor);

    const evidenceList = await AppDataSource.getRepository(Evidence).find({
      where: { ticketId: ticket.id },
      order: { createdAt: 'DESC' }
    });

    res.json({
      data: evidenceList.map(serializeEvidence)
    });
  })
);

router.delete(
  '/:id/evidence/:evidenceId',
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    if (actor.role !== UserRole.ADMIN) {
      throw new AppError(403, 'FORBIDDEN', 'Only admin can delete evidence');
    }

    const evidenceRepo = AppDataSource.getRepository(Evidence);
    const record = await evidenceRepo.findOne({ where: { id: req.params.evidenceId, ticketId: req.params.id } });
    if (!record) {
      throw new AppError(404, 'EVIDENCE_NOT_FOUND', 'Evidence not found');
    }

    await evidenceRepo.remove(record);
    if (fs.existsSync(record.filePath)) {
      fs.unlinkSync(record.filePath);
    }

    res.status(204).send();
  })
);

export default router;
