import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { TicketPriority, TicketStatus } from '../constants/ticket';
import { User } from './User';
import { Comment } from './Comment';
import { Evidence } from './Evidence';

const dateType = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'simple-enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status!: TicketStatus;

  @Column({ type: 'simple-enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority!: TicketPriority;

  @Index()
  @Column({ type: 'uuid' })
  createdByUserId!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedToUserId!: string | null;

  @Column({ type: dateType })
  dueAt!: Date;

  @CreateDateColumn({ type: dateType })
  createdAt!: Date;

  @UpdateDateColumn({ type: dateType })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.createdTickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy!: User;

  @ManyToOne(() => User, (user) => user.assignedTickets, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo!: User | null;

  @OneToMany(() => Comment, (comment) => comment.ticket)
  comments!: Comment[];

  @OneToMany(() => Evidence, (evidence) => evidence.ticket)
  evidence!: Evidence[];
}
