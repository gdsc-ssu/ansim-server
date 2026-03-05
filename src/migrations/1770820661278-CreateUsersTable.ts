import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1770820661278 implements MigrationInterface {
  name = 'CreateUsersTable1770820661278';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "googleId" character varying NOT NULL,
        "email" character varying NOT NULL,
        "name" character varying,
        "profileImage" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_googleId" UNIQUE ("googleId"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
