import { NextRequest, NextResponse } from 'next/server';
import { runAutomationPipeline } from '@/lib/automation/pipeline';

export const dynamic = 'force-dynamic';

function isAuthorizedCronRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET || process.env.AUTOMATION_API_SECRET;

  if (!expectedSecret) {
    return false;
  }

  return authHeader === `Bearer ${expectedSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAutomationPipeline({
      trigger: 'vercel_cron',
      dryRun: false,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Cron run failed.',
      },
      { status: 500 }
    );
  }
}
