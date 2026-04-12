import { NextRequest, NextResponse } from 'next/server';
import { publishScheduledAutomationJobs } from '@/lib/automation/pipeline';

export const dynamic = 'force-dynamic';

function isAuthorizedCronRequest(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET || process.env.AUTOMATION_API_SECRET;
  if (!expectedSecret) {
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  return authHeader === `Bearer ${expectedSecret}`;
}

function normalizeLimit(value: unknown, fallback = 5) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.min(50, Math.floor(parsed)));
}

async function handleScheduledPublish(request: NextRequest, limitValue: unknown) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const limit = normalizeLimit(limitValue, 5);
    const result = await publishScheduledAutomationJobs(limit);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scheduled publish run failed.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const limitValue = request.nextUrl.searchParams.get('limit');
  return handleScheduledPublish(request, limitValue);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return handleScheduledPublish(request, body?.limit);
}
