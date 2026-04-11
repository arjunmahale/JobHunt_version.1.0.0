import { AutomationRuntimeConfig, AutomationSettingsInsert, JobSourceConfig } from './types';

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function parseCsv(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSourceConfigs(value: string | undefined): JobSourceConfig[] {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value) as JobSourceConfig[];
    return Array.isArray(parsedValue)
      ? parsedValue.filter((source) => source?.id && source?.name && source?.type && source?.url)
      : [];
  } catch (error) {
    console.warn('Failed to parse JOB_SOURCE_CONFIG_JSON:', error);
    return [];
  }
}

export function getDefaultAutomationSettings(): AutomationSettingsInsert {
  return {
    id: 'default',
    review_required: parseBoolean(process.env.AUTOMATION_REVIEW_REQUIRED, true),
    auto_post_enabled: parseBoolean(process.env.AUTOMATION_AUTO_POST_ENABLED, false),
    whatsapp_enabled: parseBoolean(process.env.WHATSAPP_ENABLED, false),
    telegram_enabled: parseBoolean(process.env.TELEGRAM_ENABLED, false),
    schedule_cron: process.env.AUTOMATION_CRON_SCHEDULE || '0 9 * * *',
    max_jobs_per_run: parseInteger(process.env.AUTOMATION_MAX_JOBS_PER_RUN, 25),
  };
}

export function getAutomationRuntimeConfig(): AutomationRuntimeConfig {
  const defaults = getDefaultAutomationSettings();

  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    automationApiSecret: process.env.AUTOMATION_API_SECRET || null,
    openaiApiKey: process.env.OPENAI_API_KEY || null,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    reviewRequired: defaults.review_required ?? true,
    autoPostEnabled: defaults.auto_post_enabled ?? false,
    whatsappEnabled: defaults.whatsapp_enabled ?? false,
    telegramEnabled: defaults.telegram_enabled ?? false,
    scheduleCron: defaults.schedule_cron || '0 9 * * *',
    maxJobsPerRun: defaults.max_jobs_per_run || 25,
    whatsappRecipients: parseCsv(process.env.WHATSAPP_RECIPIENTS),
    telegramChatIds: parseCsv(process.env.TELEGRAM_CHAT_IDS),
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || null,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || null,
    twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM || null,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || null,
    sourceConfigs: parseSourceConfigs(process.env.JOB_SOURCE_CONFIG_JSON),
  };
}
