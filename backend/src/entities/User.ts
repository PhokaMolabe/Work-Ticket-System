import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { UserRole } from '../constants/roles';
import { Ticket } from './Ticket';
import { Comment } from './Comment';
import { Evidence } from './Evidence';

const dateType = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz';

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'simple-enum', enum: UserRole })
  role!: UserRole;

  @Column({ default: false })
  isLead!: boolean;

  @CreateDateColumn({ type: dateType })
  createdAt!: Date;

  @UpdateDateColumn({ type: dateType })
  updatedAt!: Date;

  @OneToMany(() => Ticket, (ticket) => ticket.createdBy)
  createdTickets!: Ticket[];

  @OneToMany(() => Ticket, (ticket) => ticket.assignedTo)
  assignedTickets!: Ticket[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @OneToMany(() => Evidence, (evidence) => evidence.uploadedBy)
  evidences!: Evidence[];
}
