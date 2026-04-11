import { NextRequest, NextResponse } from 'next/server';
import { searchJobs } from '@/lib/jobs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    if (!query) {
      return NextResponse.json({
        jobs: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      });
    }

    const { jobs, total } = await searchJobs(query, limit, offset);
    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    );
  }
}
