import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getAutomationDashboard } from '@/lib/automation/pipeline';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dashboard = await getAutomationDashboard();
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch automation jobs.' },
      { status: 500 }
    );
  }
}
