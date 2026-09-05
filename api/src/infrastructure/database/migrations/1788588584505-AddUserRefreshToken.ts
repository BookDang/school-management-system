import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRefreshToken1788588584505 implements MigrationInterface {
  name = 'AddUserRefreshToken1788588584505';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`hashedRefreshToken\` varchar(255) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`hashedRefreshToken\``);
  }
}
