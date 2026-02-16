import fs from 'fs';
import path from 'path';
import { Router } from 'express';
import { AppDataSource } from '../config/data-source';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../middleware/async-handler';
import { authenticate } from '../middleware/auth';
import { Evidence } from '../entities/Evidence';
import { assertCanParticipateOnTicket } from '../services/ticket.service';

const router = Router();

router.use(authenticate);

router.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const actor = req.user!;
    const evidence = await AppDataSource.getRepository(Evidence).findOne({
      where: { id: req.params.id },
      relations: {
        ticket: {
          createdBy: true,
          assignedTo: true
        }
      }
    });

    if (!evidence) {
      throw new AppError(404, 'EVIDENCE_NOT_FOUND', 'Evidence file not found');
    }

    assertCanParticipateOnTicket(evidence.ticket, actor);

    const absolutePath = path.resolve(evidence.filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new AppError(410, 'EVIDENCE_FILE_MISSING', 'Evidence file is missing from storage');
    }

    res.download(absolutePath, evidence.filename);
  })
);

export default router;
