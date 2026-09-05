import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRole1788586000485 implements MigrationInterface {
  name = 'AddUserRole1788586000485';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`role\` enum ('admin', 'teacher', 'student') NOT NULL DEFAULT 'student'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`role\``);
  }
}
