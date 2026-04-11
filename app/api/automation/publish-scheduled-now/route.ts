import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { publishScheduledAutomationJobs } from '@/lib/automation/pipeline';

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = Number(body?.limit || 1);
    const forceAllQueued = Boolean(body?.force_all_queued);
    const result = await publishScheduledAutomationJobs(limit, {
      includeFuture: forceAllQueued,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish scheduled jobs.' },
      { status: 500 }
    );
  }
}
