import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRbacTable1768298673004 implements MigrationInterface {
  name = 'CreateRbacTable1768298673004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_25d24010f53bb80b78e412c965" ON "role_permissions" ("role_id", "permission_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(50) NOT NULL, "display_name" character varying(100) NOT NULL, "description" text, "hierarchy" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_648e3f5447f725579d7d4ffdfb" ON "roles" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "slug" character varying(100) NOT NULL, "resource" character varying(50) NOT NULL, "action" character varying(50) NOT NULL, "description" text, "requires_ownership" boolean NOT NULL DEFAULT false, "is_wildcard" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_d090ad82a0e97ce764c06c7b312" UNIQUE ("slug"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d090ad82a0e97ce764c06c7b31" ON "permissions" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_89456a09b598ce8915c702c528" ON "permissions" ("resource") `,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" character varying(50) NOT NULL DEFAULT 'agronomist'`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER'`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_89456a09b598ce8915c702c528"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d090ad82a0e97ce764c06c7b31"`,
    );
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_648e3f5447f725579d7d4ffdfb"`,
    );
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_25d24010f53bb80b78e412c965"`,
    );
    await queryRunner.query(`DROP TABLE "role_permissions"`);
  }
}
