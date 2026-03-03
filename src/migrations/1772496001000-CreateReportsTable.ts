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
        "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
        "userId"       UUID        NOT NULL,
        "imageUrl"     VARCHAR     NOT NULL,
        "latitude"     DECIMAL(10, 7) NOT NULL,
        "longitude"    DECIMAL(10, 7) NOT NULL,
        "location"     GEOMETRY(Point, 4326),
        "hazardType"   VARCHAR     NOT NULL,
        "hazardLevel"  hazard_level NOT NULL,
        "description"  TEXT        NOT NULL,
        "aiRawResult"  JSONB,
        "createdAt"    TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reports" PRIMARY KEY ("id"),
        -- 유저 탈퇴 시 신고 데이터 보존: ON DELETE CASCADE 미적용
        CONSTRAINT "FK_reports_userId" FOREIGN KEY ("userId") REFERENCES "users"("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_reports_location" ON "reports" USING GIST ("location")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_reports_location"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE hazard_level`);
  }
}
