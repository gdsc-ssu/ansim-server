import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateImageTable1771742593598 implements MigrationInterface {
  name = 'CreateImageTable1771742593598';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "images" (
        "id"        UUID      NOT NULL DEFAULT gen_random_uuid(),
        "reportId"  UUID      NOT NULL,
        "url"       VARCHAR   NOT NULL,
        "mimeType"  VARCHAR   NOT NULL,
        "size"      BIGINT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_images" PRIMARY KEY ("id"),
        -- 신고 삭제 시 이미지도 함께 삭제
        CONSTRAINT "FK_images_reportId" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "images"`);
  }
}
