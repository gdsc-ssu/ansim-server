import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLikesTable1772496003000 implements MigrationInterface {
  name = 'CreateLikesTable1772496003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "likes" (
        "id"        UUID      NOT NULL DEFAULT gen_random_uuid(),
        "markerId"  UUID      NOT NULL,
        "userId"    UUID      NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_likes" PRIMARY KEY ("id"),
        -- 마커 삭제 시 공감도 함께 삭제
        CONSTRAINT "FK_likes_markerId" FOREIGN KEY ("markerId") REFERENCES "markers"("id") ON DELETE CASCADE,
        -- 유저 탈퇴 시 공감 데이터 보존: ON DELETE CASCADE 미적용
        CONSTRAINT "FK_likes_userId" FOREIGN KEY ("userId") REFERENCES "users"("id"),
        -- DB 레벨 중복 공감 차단 (엔티티의 @Unique(['markerId', 'userId'])와 대응)
        CONSTRAINT "UQ_likes_markerId_userId" UNIQUE ("markerId", "userId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "likes"`);
  }
}
