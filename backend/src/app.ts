import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import ticketRoutes from './routes/tickets.routes';
import adminRoutes from './routes/admin.routes';
import evidenceRoutes from './routes/evidence.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: false
    })
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/', (_req, res) => {
    res.json({
      service: 'Work Order API',
      status: 'ok',
      endpoints: {
        health: '/health',
        auth: '/auth',
        tickets: '/tickets',
        admin: '/admin',
        evidence: '/evidence'
      }
    });
  });

  app.use('/auth', authRoutes);
  app.use('/tickets', ticketRoutes);
  app.use('/admin', adminRoutes);
  app.use('/evidence', evidenceRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
