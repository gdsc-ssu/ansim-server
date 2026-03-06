import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommentsTable1772496002000 implements MigrationInterface {
  name = 'CreateCommentsTable1772496002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id"        UUID      NOT NULL DEFAULT gen_random_uuid(),
        "markerId"  UUID      NOT NULL,
        "userId"    UUID      NOT NULL,
        "content"   TEXT      NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments" PRIMARY KEY ("id"),
        -- 마커 삭제 시 댓글도 함께 삭제
        CONSTRAINT "FK_comments_markerId" FOREIGN KEY ("markerId") REFERENCES "markers"("id") ON DELETE CASCADE,
        -- 유저 탈퇴 시 댓글 데이터 보존: ON DELETE CASCADE 미적용
        CONSTRAINT "FK_comments_userId" FOREIGN KEY ("userId") REFERENCES "users"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "comments"`);
  }
}
