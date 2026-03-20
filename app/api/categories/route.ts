import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/jobs';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;

    // If admin token present, verify it (for admin dashboard)
    if (adminToken) {
      const isValid = await verifyAdminToken(adminToken);
      if (!isValid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const categories = await getCategories();

    return NextResponse.json({
      categories,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}