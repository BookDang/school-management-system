import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClasses1788600000000 implements MigrationInterface {
  name = 'CreateClasses1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`classes\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`type\` enum ('traditional', 'center') NOT NULL, \`teacherId\` varchar(36) NOT NULL, \`capacity\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`traditional_class_details\` (\`classId\` varchar(36) NOT NULL, \`gradeLevel\` varchar(255) NOT NULL, PRIMARY KEY (\`classId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`center_class_details\` (\`classId\` varchar(36) NOT NULL, \`subject\` varchar(255) NOT NULL, PRIMARY KEY (\`classId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`traditional_class_details\` ADD CONSTRAINT \`FK_traditional_class_details_classId\` FOREIGN KEY (\`classId\`) REFERENCES \`classes\`(\`id\`) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`center_class_details\` ADD CONSTRAINT \`FK_center_class_details_classId\` FOREIGN KEY (\`classId\`) REFERENCES \`classes\`(\`id\`) ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`center_class_details\` DROP FOREIGN KEY \`FK_center_class_details_classId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`traditional_class_details\` DROP FOREIGN KEY \`FK_traditional_class_details_classId\``,
    );
    await queryRunner.query(`DROP TABLE \`center_class_details\``);
    await queryRunner.query(`DROP TABLE \`traditional_class_details\``);
    await queryRunner.query(`DROP TABLE \`classes\``);
  }
}
