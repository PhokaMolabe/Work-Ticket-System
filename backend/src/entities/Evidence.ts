import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Ticket } from './Ticket';
import { User } from './User';

const dateType = process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamptz';

@Entity('evidence')
export class Evidence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ticketId!: string;

  @Column({ type: 'uuid' })
  uploadedByUserId!: string;

  @Column({ length: 255 })
  filename!: string;

  @Column({ length: 255 })
  storedFilename!: string;

  @Column({ type: 'text' })
  filePath!: string;

  @Column({ length: 255 })
  mimeType!: string;

  @Column({ type: 'int' })
  size!: number;

  @CreateDateColumn({ type: dateType })
  createdAt!: Date;

  @ManyToOne(() => Ticket, (ticket) => ticket.evidence, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket!: Ticket;

  @ManyToOne(() => User, (user) => user.evidences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedBy!: User;
}
