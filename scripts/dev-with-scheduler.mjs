import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const rootDir = process.cwd();
loadEnvFile(path.join(rootDir, '.env'));
loadEnvFile(path.join(rootDir, '.env.local'));

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const automationSecret = process.env.AUTOMATION_API_SECRET || process.env.CRON_SECRET;
const intervalMinutes = Number.parseInt(process.env.DEV_SCHEDULE_INTERVAL_MINUTES || '1', 10);
const intervalMs = Number.isFinite(intervalMinutes) && intervalMinutes > 0 ? intervalMinutes * 60 * 1000 : 60000;

if (!automationSecret) {
  console.error('AUTOMATION_API_SECRET (or CRON_SECRET) is required for scheduled publishing.');
}

async function triggerScheduledPublish() {
  if (!automationSecret) {
    return;
  }

  const response = await fetch(`${appUrl}/api/cron/publish-scheduled`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${automationSecret}`,
    },
    body: JSON.stringify({ limit: 1 }),
  });

  const payload = await response.json();
  console.log(`[${new Date().toISOString()}] Scheduled publish response:`);
  console.log(JSON.stringify(payload, null, 2));
}

async function waitForServer(maxAttempts = 30, delayMs = 1000) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${appUrl}/`);
      if (response.ok) {
        return true;
      }
    } catch {
      // ignore until server is ready
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

const isWin = process.platform === 'win32';
const nextProcess = isWin
  ? spawn('cmd.exe', ['/c', 'npm', 'run', 'dev:next'], {
      stdio: 'inherit',
      env: process.env,
    })
  : spawn('npm', ['run', 'dev:next'], {
      stdio: 'inherit',
      env: process.env,
    });

waitForServer().then((ready) => {
  if (!ready) {
    console.error('Next dev server did not start in time for scheduled publishing.');
    return;
  }

  triggerScheduledPublish().catch((error) => {
    console.error('Scheduled publish trigger failed:', error);
  });

  setInterval(() => {
    triggerScheduledPublish().catch((error) => {
      console.error('Scheduled publish trigger failed:', error);
    });
  }, intervalMs);
});

const shutdown = (signal) => {
  if (nextProcess) {
    nextProcess.kill(signal);
  }
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
