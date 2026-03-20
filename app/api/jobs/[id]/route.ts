import { NextRequest, NextResponse } from 'next/server';
import { updateJob, deleteJob } from '@/lib/jobs';
import { verifyAdminToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = await verifyAdminToken(adminToken);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const job = await updateJob(params.id, {
      ...data,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = await verifyAdminToken(adminToken);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteJob(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}