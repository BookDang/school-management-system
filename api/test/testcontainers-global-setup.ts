import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MySqlContainer } from '@testcontainers/mysql';

export const MYSQL_STATE_FILE = join(tmpdir(), 'sms-api-e2e-mysql.json');

export default async function globalSetup(): Promise<void> {
  const container = await new MySqlContainer('mysql:8.4')
    .withDatabase('school_management')
    .withUsername('sms_user')
    .withUserPassword('sms_password')
    .withRootPassword('rootpassword')
    .start();

  writeFileSync(
    MYSQL_STATE_FILE,
    JSON.stringify({
      containerId: container.getId(),
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      username: container.getUsername(),
      password: container.getUserPassword(),
    }),
  );
}
