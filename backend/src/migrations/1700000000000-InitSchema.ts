import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(120) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "passwordHash" varchar(255) NOT NULL,
        "role" varchar(20) NOT NULL CHECK ("role" IN ('ADMIN', 'AGENT', 'REQUESTER')),
        "isLead" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL,
        "status" varchar(40) NOT NULL DEFAULT 'OPEN' CHECK ("status" IN ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED')),
        "priority" varchar(20) NOT NULL DEFAULT 'MEDIUM' CHECK ("priority" IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
        "createdByUserId" uuid NOT NULL,
        "assignedToUserId" uuid NULL,
        "dueAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tickets_creator" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tickets_assignee" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query('CREATE INDEX "IDX_tickets_creator" ON "tickets" ("createdByUserId")');
    await queryRunner.query('CREATE INDEX "IDX_tickets_assignee" ON "tickets" ("assignedToUserId")');

    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ticketId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "body" text NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_comments_ticket" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "evidence" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ticketId" uuid NOT NULL,
        "uploadedByUserId" uuid NOT NULL,
        "filename" varchar(255) NOT NULL,
        "storedFilename" varchar(255) NOT NULL,
        "filePath" text NOT NULL,
        "mimeType" varchar(255) NOT NULL,
        "size" int NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_evidence_ticket" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_evidence_user" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "actorUserId" uuid NULL,
        "actorRole" varchar(20) NULL CHECK ("actorRole" IN ('ADMIN', 'AGENT', 'REQUESTER')),
        "action" varchar(80) NOT NULL,
        "resourceType" varchar(80) NOT NULL,
        "resourceId" varchar(80) NULL,
        "metadata" jsonb NULL,
        "ipAddress" varchar(80) NULL,
        "userAgent" varchar(255) NULL,
        CONSTRAINT "FK_audit_actor" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query('CREATE INDEX "IDX_audit_action_createdAt" ON "audit_logs" ("action", "createdAt")');
    await queryRunner.query('CREATE INDEX "IDX_audit_actor_createdAt" ON "audit_logs" ("actorUserId", "createdAt")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_audit_actor_createdAt"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_audit_action_createdAt"');
    await queryRunner.query('DROP TABLE IF EXISTS "audit_logs"');
    await queryRunner.query('DROP TABLE IF EXISTS "evidence"');
    await queryRunner.query('DROP TABLE IF EXISTS "comments"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tickets_assignee"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tickets_creator"');
    await queryRunner.query('DROP TABLE IF EXISTS "tickets"');
    await queryRunner.query('DROP TABLE IF EXISTS "users"');
  }
}
