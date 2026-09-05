import { readFileSync } from 'node:fs';
import { MYSQL_STATE_FILE } from './testcontainers-global-setup';

/**
 * Runs as a Jest `setupFiles` entry: before the test framework is installed, and critically
 * before each *.e2e-spec.ts file's own `import { AppModule }` runs. AppModule's TypeORM config is
 * frozen from `process.env` the moment `data-source.ts` is first imported, so these env vars must
 * land before that import - setting them in a `beforeAll` would already be too late.
 */
const state = JSON.parse(readFileSync(MYSQL_STATE_FILE, 'utf-8'));

process.env.DB_HOST = state.host;
process.env.DB_PORT = String(state.port);
process.env.DB_NAME = state.database;
process.env.DB_USER = state.username;
process.env.DB_PASSWORD = state.password;
