import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getAutomationRuntimeConfig } from '@/lib/automation/env';
import { getAutomationDashboard, updateAutomationSettings } from '@/lib/automation/pipeline';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dashboard = await getAutomationDashboard();
    return NextResponse.json({ settings: dashboard.settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch automation settings.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const telegramEnabled = Boolean(body.telegram_enabled);
    const runtimeConfig = getAutomationRuntimeConfig();

    if (telegramEnabled && !runtimeConfig.telegramBotToken) {
      return NextResponse.json(
        {
          error:
            'Cannot enable Telegram posting: TELEGRAM_BOT_TOKEN is missing in environment config.',
        },
        { status: 400 }
      );
    }

    if (telegramEnabled && runtimeConfig.telegramChatIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'Cannot enable Telegram posting: TELEGRAM_CHAT_IDS must include at least one chat id.',
        },
        { status: 400 }
      );
    }

    const settings = await updateAutomationSettings({
      review_required: Boolean(body.review_required),
      auto_post_enabled: Boolean(body.auto_post_enabled),
      whatsapp_enabled: Boolean(body.whatsapp_enabled),
      telegram_enabled: telegramEnabled,
      schedule_cron: String(body.schedule_cron || '0 9 * * *'),
      max_jobs_per_run: Number(body.max_jobs_per_run || 25),
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update automation settings.' },
      { status: 500 }
    );
  }
}
