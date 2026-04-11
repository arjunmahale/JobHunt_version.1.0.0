import fs from 'node:fs';
import path from 'node:path';

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
const dryRun = process.argv.includes('--dry-run');

if (!automationSecret) {
  console.error('AUTOMATION_API_SECRET is required.');
  process.exit(1);
}

const response = await fetch(`${appUrl}/api/automation/run`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${automationSecret}`,
  },
  body: JSON.stringify({
    trigger: dryRun ? 'local_script_dry_run' : 'local_script',
    dryRun,
  }),
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));

if (!response.ok) {
  process.exit(1);
}
