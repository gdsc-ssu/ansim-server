import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarkersTable1772496005000 implements MigrationInterface {
  name = 'CreateMarkersTable1772496005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "marker_source" AS ENUM ('report', 'safety_mungo_report')`,
    );

    await queryRunner.query(`
      CREATE TABLE "markers" (
        "id"                   UUID          NOT NULL DEFAULT gen_random_uuid(),
        -- 마커 출처가 사용자 신고인 경우에만 존재, UNIQUE로 1:1 보장
        "reportId"             UUID          UNIQUE,
        -- 마커 출처가 안전신문고인 경우에만 존재, UNIQUE로 1:1 보장
        "safetyMungoReportId"  VARCHAR       UNIQUE,
        "latitude"             DECIMAL(10,7) NOT NULL,
        "longitude"            DECIMAL(10,7) NOT NULL,
        -- lat/lng 기반 공간 인덱스용, 별도 계산 시점이 있으므로 nullable
        "location"             GEOMETRY(Point, 4326),
        "source"               marker_source NOT NULL,
        "hazardType"           VARCHAR       NOT NULL,
        -- 안전신문고 출처 마커는 위험 등급 정보가 없으므로 nullable
        "hazardLevel"          hazard_level,
        "createdAt"            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_markers" PRIMARY KEY ("id"),
        -- 신고 삭제 시 마커도 함께 삭제 (댓글, 공감 cascade로 연쇄 삭제됨)
        CONSTRAINT "FK_markers_reportId"
          FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE,
        -- 외부 데이터 삭제 시 마커도 함께 삭제
        CONSTRAINT "FK_markers_safetyMungoReportId"
          FOREIGN KEY ("safetyMungoReportId") REFERENCES "safety_mungo_reports"("externalReportId") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_markers_location" ON "markers" USING GIST ("location")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_markers_location"`);
    await queryRunner.query(`DROP TABLE "markers"`);
    await queryRunner.query(`DROP TYPE "marker_source"`);
  }
}
