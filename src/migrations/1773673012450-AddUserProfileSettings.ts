import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileSettings1773673012450 implements MigrationInterface {
    name = 'AddUserProfileSettings1773673012450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "nearbyDangerAlert" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emergencyAlert" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emergencyAlert"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "nearbyDangerAlert"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "address"`);
    }

}
