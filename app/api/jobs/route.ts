import { NextRequest, NextResponse } from 'next/server';
import { getJobs, getJobsByCategory, createJob } from '@/lib/jobs';
import { generateUniqueSlug } from '@/lib/slugify';
import { verifyAdminToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const category = searchParams.get('category');

    let jobs, total;
    if (category) {
      ({ jobs, total } = await getJobsByCategory(category, limit, offset));
    } else {
      ({ jobs, total } = await getJobs(limit, offset));
    }

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
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get('admin_token')?.value;

    // Check authorization
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const isValid = await verifyAdminToken(adminToken);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const jobData = {
      id: uuidv4(),
      title: data.title,
      company: data.company,
      location: data.location,
      salary: data.salary,
      description: data.description,
      apply_link: data.apply_link,
      category: data.category,
      slug: data.slug || generateUniqueSlug(data.title),
      job_type: data.job_type || '',
      experience_level: data.experience_level || '',
      roles_responsibilities: data.roles_responsibilities || '',
      eligibility_criteria: data.eligibility_criteria || '',
      required_skills: data.required_skills || '',

       // ✅ ADD THESE
      how_to_apply: "",
      application_deadline: null,
      work_mode: "",
      number_of_openings: 1,
      about_company: "",
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

    };

    const job = await createJob(jobData);

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}