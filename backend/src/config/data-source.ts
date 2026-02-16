import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { User } from '../entities/User';
import { Ticket } from '../entities/Ticket';
import { Comment } from '../entities/Comment';
import { Evidence } from '../entities/Evidence';
import { AuditLog } from '../entities/AuditLog';
import { InitSchema1700000000000 } from '../migrations/1700000000000-InitSchema';
import { AuditMetadataJsonb1700000000001 } from '../migrations/1700000000001-AuditMetadataJsonb';

const isTest = env.NODE_ENV === 'test';

export const AppDataSource = new DataSource(
  isTest
    ? {
        type: 'sqljs',
        synchronize: true,
        dropSchema: true,
        autoSave: false,
        entities: [User, Ticket, Comment, Evidence, AuditLog],
        migrations: []
      }
    : {
        type: 'postgres',
        host: env.DB_HOST,
        port: env.DB_PORT,
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        synchronize: false,
        logging: false,
        entities: [User, Ticket, Comment, Evidence, AuditLog],
        migrations: [InitSchema1700000000000, AuditMetadataJsonb1700000000001]
      }
);
