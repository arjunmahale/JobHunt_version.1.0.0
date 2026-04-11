import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { scheduleAutomationJobPublishing } from '@/lib/automation/pipeline';

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const startAt = String(body?.start_at || '');
    const intervalHours = Number(body?.interval_hours || 3);

    const result = await scheduleAutomationJobPublishing(startAt, intervalHours);
    return NextResponse.json({
      scheduled: result.scheduled,
      start_at: startAt,
      interval_hours: intervalHours,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to schedule publishing.' },
      { status: 500 }
    );
  }
}
