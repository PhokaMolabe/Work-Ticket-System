import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditMetadataJsonb1700000000001 implements MigrationInterface {
  name = 'AuditMetadataJsonb1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'audit_logs'
            AND column_name = 'metadata'
            AND udt_name <> 'jsonb'
        ) THEN
          ALTER TABLE "audit_logs"
          ALTER COLUMN "metadata"
          TYPE jsonb
          USING CASE
            WHEN "metadata" IS NULL OR "metadata" = '' THEN NULL
            ELSE "metadata"::jsonb
          END;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'audit_logs'
            AND column_name = 'metadata'
            AND udt_name = 'jsonb'
        ) THEN
          ALTER TABLE "audit_logs"
          ALTER COLUMN "metadata"
          TYPE text
          USING "metadata"::text;
        END IF;
      END
      $$;
    `);
  }
}
