import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClassSchedules1788794978463 implements MigrationInterface {
  name = 'CreateClassSchedules1788794978463';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`class_schedules\` (\`id\` varchar(36) NOT NULL, \`classId\` varchar(36) NOT NULL, \`startDate\` date NOT NULL, \`endDate\` date NOT NULL, \`daysOfWeek\` text NOT NULL, \`startTime\` time NOT NULL, \`endTime\` time NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`class_schedules\` ADD CONSTRAINT \`FK_class_schedules_classId\` FOREIGN KEY (\`classId\`) REFERENCES \`classes\`(\`id\`) ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`class_schedules\` DROP FOREIGN KEY \`FK_class_schedules_classId\``,
    );
    await queryRunner.query(`DROP TABLE \`class_schedules\``);
  }
}
