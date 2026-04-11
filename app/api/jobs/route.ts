import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createJob, getExistingSlugs, getJobs, getJobsByCategory, searchJobs } from '@/lib/jobs';
import { generateUniqueSlug } from '@/lib/slugify';
import { isAdminRequest } from '@/lib/auth';

function toOptionalString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function toRequiredString(value: unknown, fallback = '') {
  return String(value ?? fallback).trim();
}

function toOptionalNumber(value: unknown, fallback: number | null = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let jobs;
    let total;

    if (search) {
      ({ jobs, total } = await searchJobs(search, limit, offset));
    } else if (category) {
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
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.title || !data.company || !data.location || !data.description || !data.apply_link) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingSlugs = await getExistingSlugs();
    const slug = generateUniqueSlug(String(data.title), existingSlugs);

    const now = new Date().toISOString();
    const jobData = {
      id: uuidv4(),
      title: toRequiredString(data.title),
      company: toRequiredString(data.company),
      location: toRequiredString(data.location),
      salary: toRequiredString(data.salary, 'As per company norms'),
      description: toRequiredString(data.description),
      apply_link: toRequiredString(data.apply_link),
      category: toRequiredString(data.category, 'Technology'),
      slug,
      job_type: toRequiredString(data.job_type, 'Full Time'),
      experience_level: toRequiredString(data.experience_level),
      roles_responsibilities: toRequiredString(data.roles_responsibilities),
      eligibility_criteria: toRequiredString(data.eligibility_criteria),
      required_skills: toRequiredString(data.required_skills),
      how_to_apply: toOptionalString(data.how_to_apply) ?? '',
      application_deadline: toOptionalString(data.application_deadline),
      work_mode: toOptionalString(data.work_mode) ?? '',
      number_of_openings: toOptionalNumber(data.number_of_openings, 1),
      about_company: toOptionalString(data.about_company) ?? '',
      created_at: now,
      updated_at: now,
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
