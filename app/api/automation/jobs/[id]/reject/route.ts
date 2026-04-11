import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { rejectAutomationJob } from '@/lib/automation/pipeline';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const job = await rejectAutomationJob(params.id, body.reason);
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject automation job.' },
      { status: 500 }
    );
  }
}
