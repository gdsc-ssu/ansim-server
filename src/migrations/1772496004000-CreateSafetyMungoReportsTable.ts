import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSafetyMungoReportsTable1772496004000
  implements MigrationInterface
{
  name = 'CreateSafetyMungoReportsTable1772496004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "safety_mungo_reports" (
        "externalReportId" VARCHAR          NOT NULL,
        "externalId"       VARCHAR,
        "spotName"         VARCHAR,
        "category"         VARCHAR,
        "description"      TEXT,
        "origin"           VARCHAR,
        "occurenceDate"    DATE,
        "syncedAt"         TIMESTAMP,
        CONSTRAINT "PK_safety_mungo_reports" PRIMARY KEY ("externalReportId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "safety_mungo_reports"`);
  }
}
