import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeHazardTypeToEnum1773932177809 implements MigrationInterface {
    name = 'ChangeHazardTypeToEnum1773932177809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_likes_markerId"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_likes_userId"`);
        await queryRunner.query(`ALTER TABLE "images" DROP CONSTRAINT "FK_images_reportId"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_userId"`);
        await queryRunner.query(`ALTER TABLE "markers" DROP CONSTRAINT "FK_markers_reportId"`);
        await queryRunner.query(`ALTER TABLE "markers" DROP CONSTRAINT "FK_markers_safetyMungoReportId"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_markerId"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_markers_location"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "UQ_likes_markerId_userId"`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" DROP CONSTRAINT "PK_safety_mungo_reports"`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" DROP COLUMN "externalReportId"`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" DROP COLUMN "occurenceDate"`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" ADD "id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" ADD CONSTRAINT "PK_e87234aaed949f9e93cbe7235d5" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" ADD "occurrenceDate" date`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "hazardType"`);
        await queryRunner.query(`CREATE TYPE "public"."reports_hazardtype_enum" AS ENUM('FIRE', 'FLOOD', 'LANDSLIDE', 'SINKHOLE', 'ROAD_DAMAGE', 'COLLAPSE', 'BUILDING_DAMAGE', 'CHEMICAL', 'TRAFFIC', 'CONSTRUCTION', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "hazardType" "public"."reports_hazardtype_enum" NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."hazard_level" RENAME TO "hazard_level_old"`);
        await queryRunner.query(`CREATE TYPE "public"."reports_hazardlevel_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`);
        await queryRunner.query(`ALTER TABLE "reports" ALTER COLUMN "hazardLevel" TYPE "public"."reports_hazardlevel_enum" USING "hazardLevel"::"text"::"public"."reports_hazardlevel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hazard_level_old"`);
        await queryRunner.query(`ALTER TYPE "public"."marker_source" RENAME TO "marker_source_old"`);
        await queryRunner.query(`CREATE TYPE "public"."markers_source_enum" AS ENUM('report', 'safety_mungo_report')`);
        await queryRunner.query(`ALTER TABLE "markers" ALTER COLUMN "source" TYPE "public"."markers_source_enum" USING "source"::"text"::"public"."markers_source_enum"`);
        await queryRunner.query(`DROP TYPE "public"."marker_source_old"`);
        await queryRunner.query(`ALTER TABLE "markers" DROP COLUMN "hazardType"`);
        await queryRunner.query(`CREATE TYPE "public"."markers_hazardtype_enum" AS ENUM('FIRE', 'FLOOD', 'LANDSLIDE', 'SINKHOLE', 'ROAD_DAMAGE', 'COLLAPSE', 'BUILDING_DAMAGE', 'CHEMICAL', 'TRAFFIC', 'CONSTRUCTION', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "markers" ADD "hazardType" "public"."markers_hazardtype_enum" NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."hazard_level" RENAME TO "hazard_level_old"`);
        await queryRunner.query(`CREATE TYPE "public"."markers_hazardlevel_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`);
        await queryRunner.query(`ALTER TABLE "markers" ALTER COLUMN "hazardLevel" TYPE "public"."markers_hazardlevel_enum" USING "hazardLevel"::"text"::"public"."markers_hazardlevel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."hazard_level_old"`);
        await queryRunner.query(`ALTER TABLE "markers" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "markers" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "UQ_4a3557bfa59a2f1f2268206f396" UNIQUE ("markerId", "userId")`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_c3ac1525ed1ebf2b66f4f5cdde2" FOREIGN KEY ("markerId") REFERENCES "markers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "images" ADD CONSTRAINT "FK_31e0f5984287570db0618fe4582" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_bed415cd29716cd707e9cb3c09c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markers" ADD CONSTRAINT "FK_c99e5da2e13c2078c66cb63df62" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markers" ADD CONSTRAINT "FK_ebe551887d8c7bb1cc0c7b04895" FOREIGN KEY ("safetyMungoReportId") REFERENCES "safety_mungo_reports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_dccbd961df7c3e58e1aa193c1f4" FOREIGN KEY ("markerId") REFERENCES "markers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_dccbd961df7c3e58e1aa193c1f4"`);
        await queryRunner.query(`ALTER TABLE "markers" DROP CONSTRAINT "FK_ebe551887d8c7bb1cc0c7b04895"`);
        await queryRunner.query(`ALTER TABLE "markers" DROP CONSTRAINT "FK_c99e5da2e13c2078c66cb63df62"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_bed415cd29716cd707e9cb3c09c"`);
        await queryRunner.query(`ALTER TABLE "images" DROP CONSTRAINT "FK_31e0f5984287570db0618fe4582"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_c3ac1525ed1ebf2b66f4f5cdde2"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "UQ_4a3557bfa59a2f1f2268206f396"`);
        await queryRunner.query(`ALTER TABLE "markers" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "markers" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE TYPE "public"."hazard_level_old" AS ENUM('LOW', 'MEDIUM', 'HIGH')`);
        await queryRunner.query(`ALTER TABLE "markers" ALTER COLUMN "hazardLevel" TYPE "public"."hazard_level_old" USING "hazardLevel"::"text"::"public"."hazard_level_old"`);
        await queryRunner.query(`DROP TYPE "public"."markers_hazardlevel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."hazard_level_old" RENAME TO "hazard_level"`);
        await queryRunner.query(`ALTER TABLE "markers" DROP COLUMN "hazardType"`);
        await queryRunner.query(`DROP TYPE "public"."markers_hazardtype_enum"`);
        await queryRunner.query(`ALTER TABLE "markers" ADD "hazardType" character varying NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."marker_source_old" AS ENUM('report', 'safety_mungo_report')`);
        await queryRunner.query(`ALTER TABLE "markers" ALTER COLUMN "source" TYPE "public"."marker_source_old" USING "source"::"text"::"public"."marker_source_old"`);
        await queryRunner.query(`DROP TYPE "public"."markers_source_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."marker_source_old" RENAME TO "marker_source"`);
        await queryRunner.query(`CREATE TYPE "public"."hazard_level_old" AS ENUM('LOW', 'MEDIUM', 'HIGH')`);
        await queryRunner.query(`ALTER TABLE "reports" ALTER COLUMN "hazardLevel" TYPE "public"."hazard_level_old" USING "hazardLevel"::"text"::"public"."hazard_level_old"`);
        await queryRunner.query(`DROP TYPE "public"."reports_hazardlevel_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."hazard_level_old" RENAME TO "hazard_level"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP COLUMN "hazardType"`);
        await queryRunner.query(`DROP TYPE "public"."reports_hazardtype_enum"`);
        await queryRunner.query(`ALTER TABLE "reports" ADD "hazardType" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" DROP COLUMN "occurrenceDate"`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" DROP CONSTRAINT "PK_e87234aaed949f9e93cbe7235d5"`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" ADD "occurenceDate" date`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" ADD "externalReportId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "safety_mungo_reports" ADD CONSTRAINT "PK_safety_mungo_reports" PRIMARY KEY ("externalReportId")`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "UQ_likes_markerId_userId" UNIQUE ("markerId", "userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_markers_location" ON "markers" USING GiST ("location") `);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_markerId" FOREIGN KEY ("markerId") REFERENCES "markers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markers" ADD CONSTRAINT "FK_markers_safetyMungoReportId" FOREIGN KEY ("safetyMungoReportId") REFERENCES "safety_mungo_reports"("externalReportId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "markers" ADD CONSTRAINT "FK_markers_reportId" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_reports_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "images" ADD CONSTRAINT "FK_images_reportId" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_likes_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_likes_markerId" FOREIGN KEY ("markerId") REFERENCES "markers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
