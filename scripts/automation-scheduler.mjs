import fs from 'node:fs';
import path from 'node:path';
import cron from 'node-cron';

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
const automationSecret = process.env.AUTOMATION_API_SECRET;
const schedule = process.env.AUTOMATION_CRON_SCHEDULE || '0 9 * * *';

if (!automationSecret) {
  console.error('AUTOMATION_API_SECRET is required.');
  process.exit(1);
}

if (!cron.validate(schedule)) {
  console.error(`Invalid cron schedule: ${schedule}`);
  process.exit(1);
}

async function triggerRun() {
  const response = await fetch(`${appUrl}/api/automation/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${automationSecret}`,
    },
    body: JSON.stringify({
      trigger: 'scheduler',
      dryRun: false,
    }),
  });

  const payload = await response.json();
  console.log(`[${new Date().toISOString()}] Scheduler response:`);
  console.log(JSON.stringify(payload, null, 2));
}

console.log(`Automation scheduler started. Schedule: ${schedule}`);
cron.schedule(schedule, () => {
  triggerRun().catch((error) => {
    console.error('Scheduled automation run failed:', error);
  });
});
