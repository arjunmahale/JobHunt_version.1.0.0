import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { publishAutomationJob, scheduleSingleAutomationJob } from '@/lib/automation/pipeline';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const scheduleAt = typeof body?.schedule_at === 'string' ? body.schedule_at : '';
    const ignoreSchedule = Boolean(body?.ignore_schedule);

    if (scheduleAt) {
      const job = await scheduleSingleAutomationJob(params.id, scheduleAt);
      return NextResponse.json({ job, scheduled: true });
    }

    const job = await publishAutomationJob(params.id);
    return NextResponse.json({ job, scheduled: false, ignored_schedule: ignoreSchedule });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish automation job.' },
      { status: 500 }
    );
  }
}
