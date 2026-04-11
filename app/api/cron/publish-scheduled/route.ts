import { NextRequest, NextResponse } from 'next/server';
import { publishScheduledAutomationJobs } from '@/lib/automation/pipeline';

function isAuthorizedCronRequest(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET || process.env.AUTOMATION_API_SECRET;
  if (!expectedSecret) {
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  return authHeader === `Bearer ${expectedSecret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = Number(body?.limit || 1);
    const result = await publishScheduledAutomationJobs(limit);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scheduled publish run failed.' },
      { status: 500 }
    );
  }
}
