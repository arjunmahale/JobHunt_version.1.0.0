import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { generateJobMessage } from '@/lib/automation/delivery';
import { getAutomationRuntimeConfig } from '@/lib/automation/env';
import {
  cancelScheduledAutomationJob,
  deleteRejectedAutomationJob,
  sanitizeNormalizedJob,
} from '@/lib/automation/pipeline';
import {
  generateUniquePipelineSlug,
  getAutomationJobById,
  updateAutomationJob,
} from '@/lib/automation/store';
import { getJobById as getPublishedJobById } from '@/lib/jobs';
import { toJson } from '@/lib/automation/utils';

function normalizeInput(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMultiline(value: unknown, fallback: string) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeInput(item))
      .filter(Boolean)
      .join('\n');
  }

  const normalized = normalizeInput(value);
  return normalized || fallback;
}

function parseOptionalNumber(value: unknown, fallback: number | null) {
  const normalized = normalizeInput(value);
  if (!normalized) {
    return fallback;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseBodyObject(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  return body as Record<string, unknown>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const job = await getAutomationJobById(params.id);
    if (!job) {
      return NextResponse.json({ error: 'Automation job not found.' }, { status: 404 });
    }

    const publishedJob = job.published_job_id
      ? await getPublishedJobById(job.published_job_id)
      : null;

    return NextResponse.json({ job, published_slug: publishedJob?.slug || null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch automation job.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = parseBodyObject(await request.json().catch(() => null));
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const currentJob = await getAutomationJobById(params.id);
    if (!currentJob) {
      return NextResponse.json({ error: 'Automation job not found.' }, { status: 404 });
    }

    const title = normalizeInput(body.title) || currentJob.title;
    const company = normalizeInput(body.company) || currentJob.company;
    const location = normalizeInput(body.location) || currentJob.location || 'India';
    const salary = normalizeInput(body.salary) || currentJob.salary || 'Not Disclosed';
    const description = normalizeInput(body.description) || currentJob.description;
    const applyLink = normalizeInput(body.apply_link) || currentJob.apply_link;
    const category = normalizeInput(body.category) || currentJob.category || 'Technology';
    const jobType = normalizeInput(body.job_type) || currentJob.job_type || 'Full Time';
    const experienceLevel =
      normalizeInput(body.experience_level) || currentJob.experience_level || '0-2 Years';
    const workMode = normalizeInput(body.work_mode) || currentJob.work_mode || '';
    const aboutCompany = normalizeInput(body.about_company) || currentJob.about_company || '';
    const rolesResponsibilities = normalizeMultiline(
      body.roles_responsibilities,
      currentJob.roles_responsibilities || ''
    );
    const eligibilityCriteria = normalizeMultiline(
      body.eligibility_criteria,
      currentJob.eligibility_criteria || ''
    );
    const requiredSkills = normalizeMultiline(body.required_skills, currentJob.required_skills || '');
    const howToApply = normalizeMultiline(body.how_to_apply, currentJob.how_to_apply || '');
    const applicationDeadline =
      normalizeInput(body.application_deadline) || currentJob.application_deadline || null;
    const numberOfOpenings = parseOptionalNumber(body.number_of_openings, currentJob.number_of_openings);

    const slug = currentJob.slug || (await generateUniquePipelineSlug(title || currentJob.title || 'job'));

    const currentNormalizedPayload =
      currentJob.normalized_payload &&
      typeof currentJob.normalized_payload === 'object' &&
      !Array.isArray(currentJob.normalized_payload)
        ? (currentJob.normalized_payload as Record<string, unknown>)
        : {};
    const bodyNormalizedPayload =
      body.normalized_payload &&
      typeof body.normalized_payload === 'object' &&
      !Array.isArray(body.normalized_payload)
        ? (body.normalized_payload as Record<string, unknown>)
        : {};

    const normalizedPayload = toJson({
      ...currentNormalizedPayload,
      ...bodyNormalizedPayload,
      qualification: 'CS/IT Graduate',
      salary,
      experience_level: experienceLevel,
      location,
      work_mode: workMode,
    });

    const sanitized = sanitizeNormalizedJob({
      title,
      company,
      location,
      salary,
      description,
      apply_link: applyLink,
      category,
      slug,
      job_type: jobType,
      experience_level: experienceLevel,
      roles_responsibilities: rolesResponsibilities,
      eligibility_criteria: eligibilityCriteria,
      required_skills: requiredSkills,
      how_to_apply: howToApply,
      work_mode: workMode,
      about_company: aboutCompany,
      normalized_payload: normalizedPayload,
    });

    const runtimeConfig = getAutomationRuntimeConfig();
    const generatedMessage = generateJobMessage(
      {
        company: sanitized.company,
        title: sanitized.title,
        slug: sanitized.slug,
        experience_level: sanitized.experience_level,
        location: sanitized.location,
        salary: sanitized.salary,
        normalized_payload: sanitized.normalized_payload,
      },
      runtimeConfig.appUrl
    );

    const updatedJob = await updateAutomationJob(currentJob.id, {
      title: sanitized.title,
      company: sanitized.company,
      location: sanitized.location,
      salary: sanitized.salary,
      description: sanitized.description,
      apply_link: sanitized.apply_link,
      category: sanitized.category,
      slug: sanitized.slug,
      job_type: sanitized.job_type,
      experience_level: sanitized.experience_level,
      roles_responsibilities: sanitized.roles_responsibilities,
      eligibility_criteria: sanitized.eligibility_criteria,
      required_skills: sanitized.required_skills,
      how_to_apply: sanitized.how_to_apply,
      application_deadline: applicationDeadline,
      work_mode: sanitized.work_mode,
      number_of_openings: numberOfOpenings,
      about_company: sanitized.about_company,
      normalized_payload: toJson(sanitized.normalized_payload),
      whatsapp_message: generatedMessage,
      telegram_message: generatedMessage,
      failure_reason: null,
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update automation job.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await deleteRejectedAutomationJob(params.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete automation job.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body?.action === 'cancel_schedule') {
      const job = await cancelScheduledAutomationJob(params.id);
      return NextResponse.json({ job, canceled: true });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update automation job.' },
      { status: 500 }
    );
  }
}
