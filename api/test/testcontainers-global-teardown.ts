import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { MYSQL_STATE_FILE } from './testcontainers-global-setup';

export default async function globalTeardown(): Promise<void> {
  if (!existsSync(MYSQL_STATE_FILE)) {
    return;
  }

  const { containerId } = JSON.parse(readFileSync(MYSQL_STATE_FILE, 'utf-8'));

  try {
    // Stop directly via the Docker CLI rather than re-resolving the container through
    // testcontainers - globalSetup and globalTeardown don't reliably share the same process,
    // so there's no live container handle to call .stop() on here. Testcontainers' own Ryuk
    // reaper would eventually clean this up anyway; this just makes it immediate.
    execSync(`docker rm -f ${containerId}`, { stdio: 'ignore' });
  } catch {
    // Already gone (e.g. reaped) - nothing to do.
  }

  rmSync(MYSQL_STATE_FILE, { force: true });
}
