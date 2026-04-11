import { AutomationJobRow, AutomationRuntimeConfig, DeliveryAttemptResult } from './types';

const DEFAULT_PUBLIC_APP_URL = 'https://jobhuntportal.vercel.app';

function normalizeWhatsappRecipient(value: string) {
  return value.startsWith('whatsapp:') ? value : `whatsapp:${value}`;
}

function cleanMessageValue(value: unknown, fallback: string) {
  const normalized = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return fallback;
  }

  if (normalized === normalized.toLowerCase()) {
    return normalized.replace(/\b\w/g, (match) => match.toUpperCase());
  }

  return normalized;
}

function normalizePublicAppUrl(appUrl: string | null | undefined) {
  const normalized = String(appUrl || '').trim();
  if (!normalized) {
    return DEFAULT_PUBLIC_APP_URL;
  }

  try {
    return new URL(normalized).toString().replace(/\/+$/, '');
  } catch {
    return DEFAULT_PUBLIC_APP_URL;
  }
}

function getPublicJobUrl(slug: string | null | undefined, appUrl: string | null | undefined) {
  const jobsBaseUrl = `${normalizePublicAppUrl(appUrl)}/jobs`;
  const normalizedSlug = String(slug || '').trim();
  return normalizedSlug ? `${jobsBaseUrl}/${normalizedSlug}` : jobsBaseUrl;
}

export function generateJobMessage(
  job: Pick<
    AutomationJobRow,
    'company' | 'title' | 'slug' | 'experience_level' | 'location' | 'salary' | 'normalized_payload'
  >,
  appUrl: string | null | undefined = DEFAULT_PUBLIC_APP_URL
) {
  const company = cleanMessageValue(job.company, 'Unknown Company');
  const title = cleanMessageValue(job.title, 'IT Role');
  const experience = cleanMessageValue(job.experience_level, '0-2 Years');
  const location = cleanMessageValue(job.location, 'India');
  const salary = cleanMessageValue(job.salary, 'Not Disclosed');
  const jobUrl = getPublicJobUrl(job.slug, appUrl);

  return [
    `\u{1F680} ${company} Hiring 2026`,
    '',
    `\u{1F3E2} Company: ${company}`,
    `\u{1F4CC} Role: ${title}`,
    `\u{1F393} Qualification: CS/IT Graduate`,
    `\u{1F4BC} Experience: ${experience}`,
    `\u{1F4CD} Location: ${location}`,
    `\u{1F4B0} Salary: ${salary}`,
    '',
    `\u{1F449} Apply here: ${jobUrl}`,
    '',
    `\u{1F449} Share with friends \u{1F680}`,
  ].join('\n');
}

async function sendWhatsappMessage(
  job: AutomationJobRow,
  runtimeConfig: AutomationRuntimeConfig
): Promise<DeliveryAttemptResult[]> {
  if (
    !runtimeConfig.whatsappEnabled ||
    !runtimeConfig.twilioAccountSid ||
    !runtimeConfig.twilioAuthToken ||
    !runtimeConfig.twilioWhatsappFrom ||
    runtimeConfig.whatsappRecipients.length === 0
  ) {
    return runtimeConfig.whatsappRecipients.map((recipient) => ({
      channel: 'whatsapp',
      recipient,
      provider: 'twilio',
      status: 'skipped',
      errorMessage: 'WhatsApp delivery is disabled or not configured.',
    }));
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${runtimeConfig.twilioAccountSid}/Messages.json`;
  const authValue = Buffer.from(
    `${runtimeConfig.twilioAccountSid}:${runtimeConfig.twilioAuthToken}`
  ).toString('base64');
  const message = generateJobMessage(job, runtimeConfig.appUrl);

  return Promise.all(
    runtimeConfig.whatsappRecipients.map(async (recipient) => {
      try {
        const body = new URLSearchParams({
          From: normalizeWhatsappRecipient(runtimeConfig.twilioWhatsappFrom as string),
          To: normalizeWhatsappRecipient(recipient),
          Body: message,
        });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authValue}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        });

        const payload = await response.json();
        if (!response.ok) {
          return {
            channel: 'whatsapp',
            recipient,
            provider: 'twilio',
            status: 'failed',
            responsePayload: payload,
            errorMessage: payload?.message || 'Twilio request failed.',
          } satisfies DeliveryAttemptResult;
        }

        return {
          channel: 'whatsapp',
          recipient,
          provider: 'twilio',
          status: 'sent',
          providerMessageId: payload.sid || null,
          responsePayload: payload,
        } satisfies DeliveryAttemptResult;
      } catch (error) {
        return {
          channel: 'whatsapp',
          recipient,
          provider: 'twilio',
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown Twilio delivery error.',
        } satisfies DeliveryAttemptResult;
      }
    })
  );
}

async function sendTelegramMessage(
  job: AutomationJobRow,
  runtimeConfig: AutomationRuntimeConfig
): Promise<DeliveryAttemptResult[]> {
  if (!runtimeConfig.telegramEnabled) {
    return [];
  }

  if (!runtimeConfig.telegramBotToken) {
    return [
      {
        channel: 'telegram',
        recipient: 'configuration',
        provider: 'telegram-bot-api',
        status: 'failed',
        errorMessage: 'Telegram is enabled but TELEGRAM_BOT_TOKEN is missing.',
      },
    ];
  }

  if (runtimeConfig.telegramChatIds.length === 0) {
    return [
      {
        channel: 'telegram',
        recipient: 'configuration',
        provider: 'telegram-bot-api',
        status: 'failed',
        errorMessage: 'Telegram is enabled but TELEGRAM_CHAT_IDS is empty.',
      },
    ];
  }

  const message = generateJobMessage(job, runtimeConfig.appUrl);

  return Promise.all(
    runtimeConfig.telegramChatIds.map(async (recipient) => {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${runtimeConfig.telegramBotToken}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: recipient,
              text: message,
              disable_web_page_preview: true,
            }),
          }
        );

        const payload = await response.json();
        if (!response.ok || payload?.ok === false) {
          return {
            channel: 'telegram',
            recipient,
            provider: 'telegram-bot-api',
            status: 'failed',
            responsePayload: payload,
            errorMessage: payload?.description || 'Telegram request failed.',
          } satisfies DeliveryAttemptResult;
        }

        return {
          channel: 'telegram',
          recipient,
          provider: 'telegram-bot-api',
          status: 'sent',
          providerMessageId: String(payload?.result?.message_id || ''),
          responsePayload: payload,
        } satisfies DeliveryAttemptResult;
      } catch (error) {
        return {
          channel: 'telegram',
          recipient,
          provider: 'telegram-bot-api',
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown Telegram delivery error.',
        } satisfies DeliveryAttemptResult;
      }
    })
  );
}

export async function deliverAutomationJob(
  job: AutomationJobRow,
  runtimeConfig: AutomationRuntimeConfig
) {
  const [whatsappResults, telegramResults] = await Promise.all([
    sendWhatsappMessage(job, runtimeConfig),
    sendTelegramMessage(job, runtimeConfig),
  ]);

  return [...whatsappResults, ...telegramResults];
}
