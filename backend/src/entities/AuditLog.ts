import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { UserRole } from '../constants/roles';
import { User } from './User';

const dateType = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz';
const metadataType = process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: dateType })
  createdAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ type: 'simple-enum', enum: UserRole, nullable: true })
  actorRole!: UserRole | null;

  @Column({ length: 80 })
  action!: string;

  @Column({ length: 80 })
  resourceType!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  resourceId!: string | null;

  @Column({ type: metadataType as 'simple-json' | 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actorUserId' })
  actor!: User | null;
}
