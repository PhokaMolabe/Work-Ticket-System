import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { asyncHandler } from '../middleware/async-handler';
import { validate } from '../middleware/validate';
import { AppError } from '../errors/AppError';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRole } from '../constants/roles';
import { serializeUser } from '../utils/serializers';
import { writeAuditLog } from '../services/audit.service';
import { AUDIT_ACTIONS } from '../constants/audit';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(UserRole),
  isLead: z.boolean().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post(
  '/register',
  authenticate,
  requireRoles(UserRole.ADMIN),
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role, isLead } = req.body;
    const repo = AppDataSource.getRepository(User);
    const normalizedEmail = String(email).toLowerCase();

    const existing = await repo.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new AppError(409, 'USER_EXISTS', 'A user with this email already exists');
    }

    const user = repo.create({
      name,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role,
      isLead: role === UserRole.AGENT ? Boolean(isLead) : false
    });

    await repo.save(user);

    res.status(201).json({
      data: serializeUser(user)
    });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email).toLowerCase();
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: normalizedEmail })
      .getOne();

    if (!user) {
      await writeAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILURE,
        resourceType: 'AUTH',
        metadata: { email: normalizedEmail, reason: 'EMAIL_NOT_FOUND' },
        req
      });
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      await writeAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILURE,
        resourceType: 'AUTH',
        actorUserId: user.id,
        actorRole: user.role,
        metadata: { email: normalizedEmail, reason: 'PASSWORD_MISMATCH' },
        req
      });
      throw new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = signToken({
      sub: user.id,
      role: user.role,
      isLead: user.isLead
    });

    await writeAuditLog({
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      resourceType: 'AUTH',
      resourceId: user.id,
      actorUserId: user.id,
      actorRole: user.role,
      metadata: { email: normalizedEmail },
      req
    });

    res.json({
      data: {
        token,
        user: serializeUser(user)
      }
    });
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: actor.id } });
    if (!user) {
      throw new AppError(401, 'AUTH_INVALID', 'Authenticated user no longer exists');
    }

    res.json({
      data: serializeUser(user)
    });
  })
);

export default router;
