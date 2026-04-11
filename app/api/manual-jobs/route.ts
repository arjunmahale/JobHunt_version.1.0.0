import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { processManualJobUploads } from '@/lib/automation/pipeline';

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.jobs)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected { jobs: string[] }.' },
        { status: 400 }
      );
    }

    const jobs = (body.jobs as unknown[]).filter((job): job is string => typeof job === 'string');
    const result = await processManualJobUploads(jobs);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process manual jobs.' },
      { status: 500 }
    );
  }
}
