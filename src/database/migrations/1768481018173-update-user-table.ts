import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserTable1768481018173 implements MigrationInterface {
  name = 'UpdateUserTable1768481018173';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "has_set_password" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "has_set_password"`,
    );
  }
}
