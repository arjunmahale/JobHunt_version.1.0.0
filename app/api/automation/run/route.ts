import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, isAutomationRequestAuthorized } from '@/lib/auth';
import { runAutomationPipeline } from '@/lib/automation/pipeline';

export async function POST(request: NextRequest) {
  const isAdmin = await isAdminRequest(request);
  const isAutomationSecretAuthorized = isAutomationRequestAuthorized(request);

  if (!isAdmin && !isAutomationSecretAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await runAutomationPipeline({
      trigger: String(body?.trigger || (isAdmin ? 'admin_manual' : 'scheduler')),
      dryRun: Boolean(body?.dryRun),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Automation run failed.' },
      { status: 500 }
    );
  }
}
