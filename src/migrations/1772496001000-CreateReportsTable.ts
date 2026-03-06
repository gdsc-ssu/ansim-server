import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportsTable1772496001000 implements MigrationInterface {
  name = 'CreateReportsTable1772496001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    await queryRunner.query(
      `CREATE TYPE hazard_level AS ENUM ('LOW', 'MEDIUM', 'HIGH')`,
    );

    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
        "userId"       UUID         NOT NULL,
        "hazardType"   VARCHAR      NOT NULL,
        "hazardLevel"  hazard_level NOT NULL,
        "description"  TEXT         NOT NULL,
        "aiRawResult"  JSONB,
        "createdAt"    TIMESTAMP    NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reports" PRIMARY KEY ("id"),
        -- 유저 탈퇴 시 신고 데이터 보존: ON DELETE CASCADE 미적용
        CONSTRAINT "FK_reports_userId" FOREIGN KEY ("userId") REFERENCES "users"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE hazard_level`);
  }
}
