import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1768210352319 implements MigrationInterface {
  name = 'CreateAuditLogsTable1768210352319';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      // eslint-disable-next-line max-len
      `CREATE TABLE "audit_logs" ("id" BIGSERIAL NOT NULL, "user_id" uuid, "action" character varying(100) NOT NULL, "entity_type" character varying(50) NOT NULL, "entity_id" character varying(100) NOT NULL, "old_values" jsonb, "new_values" jsonb, "ip_address" character varying(45), "user_agent" text, "source" character varying(20) NOT NULL DEFAULT 'web', "status" character varying(20) NOT NULL DEFAULT 'success', "error_message" text, "metadata" jsonb, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd2726fd31b35443f2245b93ba" ON "audit_logs" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17b613a55b287678b6f26ab8b2" ON "audit_logs" ("action", "timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7421efc125d95e413657efa3c6" ON "audit_logs" ("entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4bbe32b3f6fca66f54509fe57e" ON "audit_logs" ("user_id", "timestamp") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4bbe32b3f6fca66f54509fe57e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7421efc125d95e413657efa3c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17b613a55b287678b6f26ab8b2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd2726fd31b35443f2245b93ba"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
