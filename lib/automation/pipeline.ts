import { v4 as uuidv4 } from 'uuid';
import { createJob as createPublishedJob, getJobById as getPublishedJobById } from '@/lib/jobs';
import { getDefaultAutomationSettings, getAutomationRuntimeConfig } from './env';
import { extractStructuredJob } from './ai';
import { extractStructuredManualJob, isStructuredManualJsonInput } from './manual-parser';
import { buildSourceHash, normalizeExtractedJob } from './normalize';
import { fetchJobsFromSource } from './sources';
import {
  createAutomationEvent,
  createAutomationRun,
  createDeliveryLog,
  listAutomationJobsForScheduling,
  listDueScheduledAutomationJobs,
  findOpenAutomationDuplicate,
  findPublishedDuplicate,
  deleteAutomationJobById,
  generateUniquePipelineSlug,
  getAutomationJobById,
  getAutomationJobBySourceHash,
  getAutomationSettings,
  listAutomationJobs,
  listAutomationRuns,
  updateAutomationJob,
  updateAutomationRun,
  upsertAutomationJob,
  upsertAutomationSettings,
} from './store';
import { deliverAutomationJob, generateJobMessage } from './delivery';
import { hashText, toJson } from './utils';
import {
  AutomationJobRow,
  AutomationRuntimeConfig,
  AutomationSettingsRow,
  JobSourceConfig,
  ManualJobUploadResult,
  PipelineRunOptions,
  PipelineRunResult,
  RawFetchedJob,
} from './types';

const IT_ROLE_KEYWORDS = [
  'engineer',
  'developer',
  'software',
  'backend',
  'frontend',
  'full stack',
  'fullstack',
  'java',
  'python',
  'react',
  'angular',
  'node',
  'aws',
  'cloud',
  'devops',
  'qa',
  'testing',
  'sdet',
  'analyst',
  'it',
  'technology',
];

const FRESHER_KEYWORDS = [
  '0-2 years',
  '0 to 2 years',
  '0-1 years',
  '0 to 1 years',
  '1-2 years',
  '1 to 2 years',
  'fresher',
  'freshers',
  'entry level',
  'entry-level',
  'internship',
  'intern',
  'graduate trainee',
  'new grad',
  'campus',
];

const SENIOR_KEYWORDS = [
  '3+ years',
  '3 years',
  '4+ years',
  '4 years',
  '5+ years',
  '5 years',
  '6+ years',
  '6 years',
  '7+ years',
  '7 years',
  '8+ years',
  'senior',
  'sr.',
  'lead',
  'principal',
  'staff engineer',
  'architect',
  'manager',
];

const INDIA_LOCATION_KEYWORDS = [
  'india',
  'pune',
  'bangalore',
  'bengaluru',
  'mumbai',
  'hyderabad',
  'chennai',
  'gurgaon',
  'gurugram',
  'noida',
  'remote india',
];

const REJECTED_LOCATION_KEYWORDS = [
  'usa',
  'united states',
  'europe',
  'remote global',
  'global remote',
  'worldwide',
  'emea',
];

const MANUAL_UPLOAD_SOURCE: JobSourceConfig = {
  id: 'manual_admin_upload',
  name: 'Manual Upload',
  type: 'html',
  url: 'https://jobhuntportal.vercel.app',
  category: 'Technology',
  location: 'India',
};

const DEFAULT_MANUAL_APPLY_LINK = 'https://jobhuntportal.vercel.app';

const TITLE_PATTERNS = [/^(?:job\s*title|title|role|position)\s*[:\-]\s*(.+)$/i];
const COMPANY_PATTERNS = [/^(?:company|organization|employer)\s*[:\-]\s*(.+)$/i];
const LOCATION_PATTERNS = [/^(?:location|job\s*location)\s*[:\-]\s*(.+)$/i];

type ProcessJobResult = {
  processed: number;
  pending: number;
  published: number;
  failed: number;
  skipped: number;
  skipReason?: string;
  error?: string;
};

type ProcessJobParams = {
  rawJob: RawFetchedJob;
  source: JobSourceConfig;
  dryRun: boolean;
  runId: string | null;
  runtimeConfig: AutomationRuntimeConfig;
};

type ManualProcessingSummary = {
  processed: number;
  skipped: number;
  pending: number;
  published: number;
  failed: number;
  errors: string[];
  reasons: Array<{
    input_index: number;
    reason: string;
  }>;
};

function normalizeSpace(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeManualInput(value: unknown) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .trim();
}

function includesAnyKeyword(value: string, keywords: string[]) {
  const normalizedValue = value.toLowerCase();
  return keywords.some((keyword) => normalizedValue.includes(keyword));
}

function splitListText(value: string) {
  const cleaned = String(value || '').replace(/\r/g, '').trim();
  if (!cleaned) {
    return [];
  }

  let parts = cleaned
    .split(/\n|•|;|,/)
    .map((item) => normalizeSpace(item.replace(/^(?:[-*•\u2022]|\d+[.)])\s*/g, '')))
    .filter(Boolean);

  if (parts.length <= 1 && cleaned.length > 120) {
    parts = cleaned
      .split(/(?<=[a-z0-9])\s+(?=[A-Z][a-z])/)
      .map((item) => normalizeSpace(item))
      .filter(Boolean);
  }

  return parts;
}

function dedupeLines(value: string) {
  return [...new Set(splitListText(value))].join('\n');
}

function extractLabeledValue(text: string, patterns: RegExp[]) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match?.[1]) {
        return normalizeSpace(match[1]);
      }
    }
  }

  return '';
}

function getFirstMeaningfulLine(text: string) {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => normalizeSpace(line))
    .find(Boolean);

  if (!firstLine) {
    return '';
  }

  return firstLine.slice(0, 120);
}

function extractFirstUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s<>"')]+/i);
  return match?.[0] || null;
}

function buildManualRawJob(rawText: string, index: number): RawFetchedJob {
  const applyLink = extractFirstUrl(rawText) || DEFAULT_MANUAL_APPLY_LINK;

  return {
    sourceId: MANUAL_UPLOAD_SOURCE.id,
    sourceName: MANUAL_UPLOAD_SOURCE.name,
    sourceType: MANUAL_UPLOAD_SOURCE.type,
    sourceUrl: DEFAULT_MANUAL_APPLY_LINK,
    externalId: hashText(rawText),
    title: extractLabeledValue(rawText, TITLE_PATTERNS) || getFirstMeaningfulLine(rawText) || null,
    company: extractLabeledValue(rawText, COMPANY_PATTERNS) || null,
    location: extractLabeledValue(rawText, LOCATION_PATTERNS) || null,
    detailUrl: applyLink,
    applyLink,
    description: rawText,
    rawPayload: {
      raw_text: rawText,
    },
    metadata: {
      input_method: 'manual_upload',
      input_index: index,
    },
  };
}

export function sanitizeNormalizedJob<
  T extends {
    title: string;
    company: string;
    location: string;
    salary: string;
    description: string;
    apply_link: string;
    category: string;
    slug: string;
    job_type: string;
    experience_level: string;
    roles_responsibilities: string;
    eligibility_criteria: string;
    required_skills: string;
    how_to_apply: string;
    work_mode: string;
    about_company: string;
    normalized_payload: unknown;
  },
>(job: T): T {
  const normalizedPayload =
    job.normalized_payload &&
    typeof job.normalized_payload === 'object' &&
    !Array.isArray(job.normalized_payload)
      ? (job.normalized_payload as Record<string, unknown>)
      : {};

  return {
    ...job,
    title: normalizeSpace(job.title),
    company: normalizeSpace(job.company),
    location: normalizeSpace(job.location) || 'India',
    salary: normalizeSpace(job.salary) || 'Not Disclosed',
    description: normalizeSpace(job.description),
    apply_link: normalizeSpace(job.apply_link),
    category: normalizeSpace(job.category) || 'Technology',
    slug: normalizeSpace(job.slug),
    job_type: normalizeSpace(job.job_type) || 'Full Time',
    experience_level: normalizeSpace(job.experience_level) || '0-2 Years',
    roles_responsibilities: dedupeLines(job.roles_responsibilities),
    eligibility_criteria: dedupeLines(job.eligibility_criteria),
    required_skills: dedupeLines(job.required_skills),
    how_to_apply: dedupeLines(job.how_to_apply),
    work_mode: normalizeSpace(job.work_mode),
    about_company: normalizeSpace(job.about_company),
    normalized_payload: toJson({
      ...normalizedPayload,
      salary: normalizeSpace(job.salary) || 'Not Disclosed',
      qualification: 'CS/IT Graduate',
      experience_level: normalizeSpace(job.experience_level) || '0-2 Years',
    }),
  };
}

function hasRequiredJobFields(job: {
  title: string;
  company: string;
  description: string;
  apply_link: string;
  slug: string;
}) {
  return Boolean(
    normalizeSpace(job.title) &&
      normalizeSpace(job.company) &&
      normalizeSpace(job.description) &&
      normalizeSpace(job.apply_link) &&
      normalizeSpace(job.slug)
  );
}

export function getFilterDecision(job: {
  title: string;
  location: string;
  experienceSignals: string;
  description: string;
}) {
  const titleText = normalizeSpace(job.title).toLowerCase();
  const locationText = normalizeSpace(job.location).toLowerCase();
  const combinedText = [
    normalizeSpace(job.title),
    normalizeSpace(job.description),
    normalizeSpace(job.experienceSignals),
  ]
    .join(' ')
    .toLowerCase();

  const isITRole =
    includesAnyKeyword(titleText, IT_ROLE_KEYWORDS) ||
    includesAnyKeyword(combinedText, IT_ROLE_KEYWORDS);

  const hasPositiveExperienceSignal = includesAnyKeyword(combinedText, FRESHER_KEYWORDS);
  const hasNegativeExperienceSignal =
    includesAnyKeyword(combinedText, SENIOR_KEYWORDS) ||
    /\b([3-9]|[1-9]\d+)\+?\s*(years?|yrs?)\b/.test(combinedText);
  const isFresher = hasPositiveExperienceSignal || !hasNegativeExperienceSignal;

  const isIndia =
    (
      includesAnyKeyword(locationText, INDIA_LOCATION_KEYWORDS) ||
      locationText.includes('remote') ||
      locationText === ''
    ) &&
    !includesAnyKeyword(locationText, REJECTED_LOCATION_KEYWORDS);

  return {
    isITRole,
    isFresher,
    isIndia,
  };
}

async function logSkippedJob(
  runId: string | null,
  step: string,
  message: string,
  payload: Record<string, unknown>
) {
  await createAutomationEvent({
    automation_job_id: null,
    run_id: runId,
    level: 'info',
    step,
    message,
    payload: toJson(payload),
  });
}

async function getEffectiveSettings() {
  const runtimeConfig = getAutomationRuntimeConfig();
  const defaults = getDefaultAutomationSettings();
  let dbSettings = await getAutomationSettings();

  if (!dbSettings) {
    dbSettings = await upsertAutomationSettings(defaults);
  }

  const settings: AutomationSettingsRow = {
    id: 'default',
    review_required: dbSettings.review_required ?? defaults.review_required ?? true,
    auto_post_enabled: dbSettings.auto_post_enabled ?? defaults.auto_post_enabled ?? false,
    whatsapp_enabled: dbSettings.whatsapp_enabled ?? defaults.whatsapp_enabled ?? false,
    telegram_enabled: dbSettings.telegram_enabled ?? defaults.telegram_enabled ?? false,
    schedule_cron: dbSettings.schedule_cron || defaults.schedule_cron || '0 9 * * *',
    max_jobs_per_run: dbSettings.max_jobs_per_run || defaults.max_jobs_per_run || 25,
    updated_at: dbSettings.updated_at,
  };

  return {
    runtimeConfig: {
      ...runtimeConfig,
      reviewRequired: settings.review_required,
      autoPostEnabled: settings.auto_post_enabled,
      whatsappEnabled: settings.whatsapp_enabled,
      telegramEnabled: settings.telegram_enabled,
      scheduleCron: settings.schedule_cron,
      maxJobsPerRun: settings.max_jobs_per_run,
    },
    settings,
  };
}

async function publishJobRecord(
  automationJob: AutomationJobRow,
  runId: string | null,
  forceReviewApproval = false
) {
  const { runtimeConfig } = await getEffectiveSettings();

  let latestJob = automationJob;
  const now = new Date().toISOString();

  if (forceReviewApproval && latestJob.review_status === 'pending') {
    latestJob = await updateAutomationJob(latestJob.id, {
      review_status: 'approved',
      reviewed_at: now,
      failure_reason: null,
    });
  }

  let publishedJobId = latestJob.published_job_id;
  if (!publishedJobId) {
    const existingPublished = await findPublishedDuplicate(latestJob.title, latestJob.company);
    if (existingPublished) {
      publishedJobId = existingPublished.id;
    } else {
      const freshSlug = await generateUniquePipelineSlug(latestJob.title);
      const publishedJob = await createPublishedJob({
        id: uuidv4(),
        title: latestJob.title,
        company: latestJob.company,
        location: latestJob.location || 'India',
        salary: latestJob.salary || 'Not Disclosed',
        description: latestJob.description,
        apply_link: latestJob.apply_link,
        category: latestJob.category,
        slug: freshSlug,
        job_type: latestJob.job_type,
        experience_level: latestJob.experience_level,
        roles_responsibilities: latestJob.roles_responsibilities,
        eligibility_criteria: latestJob.eligibility_criteria,
        required_skills: latestJob.required_skills,
        how_to_apply: latestJob.how_to_apply,
        application_deadline: latestJob.application_deadline,
        work_mode: latestJob.work_mode,
        number_of_openings: latestJob.number_of_openings,
        about_company: latestJob.about_company,
        created_at: now,
        updated_at: now,
      });
      publishedJobId = publishedJob.id;
    }
  }

  let publishedSlug = latestJob.slug;
  if (publishedJobId) {
    const publishedJob = await getPublishedJobById(publishedJobId);
    if (publishedJob?.slug) {
      publishedSlug = publishedJob.slug;
      latestJob = { ...latestJob, slug: publishedSlug };
    }
  }

  const deliveryAttempts = await deliverAutomationJob(latestJob, runtimeConfig);

  for (const attempt of deliveryAttempts) {
    await createDeliveryLog({
      automation_job_id: latestJob.id,
      channel: attempt.channel,
      recipient: attempt.recipient,
      provider: attempt.provider,
      status: attempt.status,
      provider_message_id: attempt.providerMessageId || null,
      response_payload: toJson(attempt.responsePayload || {}),
      error_message: attempt.errorMessage || null,
    });
  }

  const failedAttempts = deliveryAttempts.filter((attempt) => attempt.status === 'failed');
  const updatedJob = await updateAutomationJob(latestJob.id, {
    slug: publishedSlug,
    whatsapp_message: generateJobMessage(latestJob),
    telegram_message: generateJobMessage(latestJob),
    review_status: failedAttempts.length > 0 ? 'failed' : 'published',
    publish_status: failedAttempts.length > 0 ? 'failed' : 'published',
    published_job_id: publishedJobId,
    published_at: now,
    reviewed_at: latestJob.reviewed_at || now,
    last_attempt_at: now,
    scheduled_publish_at: null,
    failure_reason:
      failedAttempts.length > 0
        ? failedAttempts.map((attempt) => attempt.errorMessage || `${attempt.channel} failed`).join('; ')
        : null,
  });

  await createAutomationEvent({
    automation_job_id: updatedJob.id,
    run_id: runId,
    level: failedAttempts.length > 0 ? 'error' : 'info',
    step: 'publish',
    message:
      failedAttempts.length > 0
        ? 'Job published to database with channel delivery failures.'
        : 'Job published and delivery completed.',
    payload: toJson({
      publishedJobId,
      deliveries: deliveryAttempts,
    }),
  });

  return {
    job: updatedJob,
    failed: failedAttempts.length > 0,
  };
}

function createEmptyProcessResult(): ProcessJobResult {
  return {
    processed: 0,
    pending: 0,
    published: 0,
    failed: 0,
    skipped: 0,
    skipReason: undefined,
  };
}

function mergeProcessResult(
  target: Pick<PipelineRunResult, 'processed' | 'pending' | 'published' | 'failed' | 'skipped' | 'errors'>,
  outcome: ProcessJobResult
) {
  target.processed += outcome.processed;
  target.pending += outcome.pending;
  target.published += outcome.published;
  target.failed += outcome.failed;
  target.skipped += outcome.skipped;

  if (outcome.error) {
    target.errors.push(outcome.error);
  }
}

function mergeManualSummary(summary: ManualProcessingSummary, outcome: ProcessJobResult) {
  summary.processed += outcome.processed;
  summary.skipped += outcome.skipped;
  summary.pending += outcome.pending;
  summary.published += outcome.published;
  summary.failed += outcome.failed;

  if (outcome.error) {
    summary.errors.push(outcome.error);
  }
}

async function processAutomationJob({
  rawJob,
  source,
  dryRun,
  runId,
  runtimeConfig,
}: ProcessJobParams): Promise<ProcessJobResult> {
  const result = createEmptyProcessResult();
  const sourceHash = buildSourceHash(rawJob);
  const existingByHash = dryRun ? null : await getAutomationJobBySourceHash(sourceHash);

  if (existingByHash && ['pending', 'approved', 'published'].includes(existingByHash.review_status)) {
    result.skipped = 1;
    result.skipReason = 'Skipped: duplicate source hash already exists in automation queue.';
    return result;
  }

  const extractionResult =
    source.id === MANUAL_UPLOAD_SOURCE.id
      ? extractStructuredManualJob(rawJob)
      : await extractStructuredJob(rawJob, runtimeConfig);
  const { extracted, model } = extractionResult;
  const slug = await generateUniquePipelineSlug(extracted.title || rawJob.title || 'job');
  const normalized = sanitizeNormalizedJob(
    normalizeExtractedJob(extracted, rawJob, source, slug, model)
  );

  if (!hasRequiredJobFields(normalized)) {
    result.skipped = 1;
    result.skipReason = 'Skipped: missing required fields after normalization.';

    if (!dryRun) {
      await logSkippedJob(runId, 'validation', 'Job skipped due to missing required fields.', {
        source: source.id,
        title: normalized.title,
        company: normalized.company,
      });
    }

    return result;
  }

  const { isITRole, isFresher, isIndia } = getFilterDecision({
    title: normalized.title,
    location: normalized.location,
    experienceSignals: [
      normalizeSpace(extracted.experience),
      normalizeSpace(rawJob.description),
      normalizeSpace(rawJob.title),
    ].join(' '),
    description: normalized.description,
  });

  const manualSkillSignalText = [
    normalizeSpace(normalized.required_skills),
    normalizeSpace(normalized.description),
    normalizeSpace(normalized.title),
  ]
    .join(' ')
    .toLowerCase();
  const isManualITFallback =
    source.id === MANUAL_UPLOAD_SOURCE.id &&
    includesAnyKeyword(manualSkillSignalText, IT_ROLE_KEYWORDS);
  const isEffectiveITRole = isITRole || isManualITFallback;
  const shouldApplyTargetingFilter = source.id !== MANUAL_UPLOAD_SOURCE.id;

  if (shouldApplyTargetingFilter && (!isEffectiveITRole || !isFresher || !isIndia)) {
    result.skipped = 1;
    result.skipReason = 'Skipped: targeting filters did not match (IT + fresher + India).';

    if (!dryRun) {
      await logSkippedJob(runId, 'filter', 'Filtered out job.', {
        source: source.id,
        title: normalized.title,
        company: normalized.company,
        location: normalized.location,
        isITRole: isEffectiveITRole,
        isFresher,
        isIndia,
      });
    }

    return result;
  }

  const generatedMessage = generateJobMessage({
    company: normalized.company,
    title: normalized.title,
    slug: normalized.slug,
    experience_level: normalized.experience_level,
    location: normalized.location,
    salary: normalized.salary,
    normalized_payload: normalized.normalized_payload,
  });

  normalized.whatsapp_message = generatedMessage;
  normalized.telegram_message = generatedMessage;

  const existingPublished = await findPublishedDuplicate(normalized.title, normalized.company);
  if (existingPublished) {
    result.skipped = 1;
    result.skipReason = 'Skipped: duplicate title + company already exists in published jobs.';

    if (!dryRun) {
      const duplicateJob = await upsertAutomationJob({
        ...normalized,
        review_status: 'rejected',
        publish_status: 'skipped',
        duplicate_of_job_id: existingPublished.id,
        failure_reason: 'Duplicate title + company already exists in published jobs.',
      });

      await createAutomationEvent({
        automation_job_id: duplicateJob.id,
        run_id: runId,
        level: 'info',
        step: 'dedupe',
        message: 'Job skipped because a published duplicate already exists.',
        payload: toJson({
          duplicateOfJobId: existingPublished.id,
        }),
      });
    }

    return result;
  }

  const existingPending = dryRun
    ? null
    : await findOpenAutomationDuplicate(normalized.title, normalized.company);

  if (existingPending && existingPending.source_hash !== sourceHash) {
    result.skipped = 1;
    result.skipReason = 'Skipped: duplicate title + company already exists in automation queue.';
    return result;
  }

  result.processed = 1;

  if (dryRun) {
    if (runtimeConfig.reviewRequired) {
      result.pending = 1;
    } else {
      result.published = 1;
    }

    return result;
  }

  const storedJob = await upsertAutomationJob({
    ...normalized,
    source_hash: sourceHash,
    review_status: runtimeConfig.reviewRequired ? 'pending' : 'approved',
    publish_status:
      runtimeConfig.reviewRequired || !runtimeConfig.autoPostEnabled ? 'draft' : 'queued',
    failure_reason: null,
    duplicate_of_job_id: null,
    published_job_id: existingPending?.published_job_id || null,
  });

  await createAutomationEvent({
    automation_job_id: storedJob.id,
    run_id: runId,
    level: 'info',
    step: 'ingest',
    message: 'Job fetched, extracted, normalized, and stored.',
    payload: toJson({
      source: source.id,
      autoPost: runtimeConfig.autoPostEnabled,
    }),
  });

  if (runtimeConfig.reviewRequired || !runtimeConfig.autoPostEnabled) {
    result.pending = 1;
    return result;
  }

  const publishResult = await publishJobRecord(storedJob, runId, true);
  if (publishResult.failed) {
    result.failed = 1;
    result.error = `Publishing failed for ${storedJob.title} at ${storedJob.company}`;
    return result;
  }

  result.published = 1;
  return result;
}

export async function runAutomationPipeline(options: PipelineRunOptions): Promise<PipelineRunResult> {
  const { runtimeConfig } = await getEffectiveSettings();
  const enabledSources = runtimeConfig.sourceConfigs.filter((item) => item.enabled !== false);

  if (enabledSources.length === 0) {
    throw new Error('No job sources configured. Set JOB_SOURCE_CONFIG_JSON before running automation.');
  }

  const dryRun = options.dryRun ?? false;
  const run = dryRun ? null : await createAutomationRun(options.trigger);
  const result: PipelineRunResult = {
    runId: run?.id || null,
    dryRun,
    sourcesProcessed: 0,
    fetched: 0,
    processed: 0,
    pending: 0,
    published: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    for (const source of enabledSources) {
      result.sourcesProcessed += 1;

      const rawJobs = await fetchJobsFromSource(source);
      result.fetched += rawJobs.length;

      for (const rawJob of rawJobs) {
        if (result.processed >= runtimeConfig.maxJobsPerRun) {
          break;
        }

        try {
          const outcome = await processAutomationJob({
            rawJob,
            source,
            dryRun,
            runId: run?.id || null,
            runtimeConfig,
          });

          mergeProcessResult(result, outcome);
        } catch (error) {
          result.failed += 1;
          result.errors.push(error instanceof Error ? error.message : 'Unknown pipeline error');
        }
      }

      if (result.processed >= runtimeConfig.maxJobsPerRun) {
        break;
      }
    }

    if (run) {
      await updateAutomationRun(run.id, {
        status: result.failed > 0 ? 'completed_with_errors' : 'completed',
        sources_total: result.sourcesProcessed,
        fetched_total: result.fetched,
        processed_total: result.processed,
        pending_total: result.pending,
        published_total: result.published,
        failed_total: result.failed,
        notes: result.errors.join('\n') || null,
        finished_at: new Date().toISOString(),
      });
    }

    return result;
  } catch (error) {
    if (run) {
      await updateAutomationRun(run.id, {
        status: 'failed',
        finished_at: new Date().toISOString(),
        notes: error instanceof Error ? error.message : 'Unknown automation failure',
        sources_total: result.sourcesProcessed,
        fetched_total: result.fetched,
        processed_total: result.processed,
        pending_total: result.pending,
        published_total: result.published,
        failed_total: result.failed + 1,
      });
    }

    throw error;
  }
}

export async function processManualJobUploads(jobDescriptions: string[]): Promise<ManualJobUploadResult> {
  const submittedJobs = jobDescriptions.map((job) => normalizeManualInput(job)).filter(Boolean);
  if (submittedJobs.length === 0) {
    return {
      success: true,
      processed: 0,
      skipped: 0,
      reasons: [],
    };
  }

  const { runtimeConfig } = await getEffectiveSettings();
  const run = await createAutomationRun('admin_manual_upload');
  const summary: ManualProcessingSummary = {
    processed: 0,
    skipped: 0,
    pending: 0,
    published: 0,
    failed: 0,
    errors: [],
    reasons: [],
  };

  try {
    for (const [index, jobDescription] of submittedJobs.entries()) {
      if (jobDescription.length < 50 && !isStructuredManualJsonInput(jobDescription)) {
        summary.skipped += 1;
        summary.reasons.push({
          input_index: index + 1,
          reason: 'Skipped: input shorter than 50 characters and not structured JSON.',
        });

        await logSkippedJob(
          run.id,
          'validation',
          'Manual job skipped because the input was shorter than 50 characters and not structured JSON.',
          {
            inputIndex: index + 1,
          }
        );

        continue;
      }

      try {
        const outcome = await processAutomationJob({
          rawJob: buildManualRawJob(jobDescription, index + 1),
          source: MANUAL_UPLOAD_SOURCE,
          dryRun: false,
          runId: run.id,
          runtimeConfig,
        });

        mergeManualSummary(summary, outcome);
        if (outcome.skipped > 0) {
          summary.reasons.push({
            input_index: index + 1,
            reason: outcome.skipReason || 'Skipped: job did not pass pipeline validation.',
          });
        }
      } catch (error) {
        summary.skipped += 1;
        summary.failed += 1;
        summary.errors.push(error instanceof Error ? error.message : 'Unknown manual upload error');
        summary.reasons.push({
          input_index: index + 1,
          reason: error instanceof Error ? error.message : 'Skipped: manual upload error.',
        });

        await createAutomationEvent({
          automation_job_id: null,
          run_id: run.id,
          level: 'error',
          step: 'manual_upload',
          message: 'Manual job processing failed.',
          payload: toJson({
            inputIndex: index + 1,
            error: error instanceof Error ? error.message : 'Unknown manual upload error',
          }),
        });
      }
    }

    await updateAutomationRun(run.id, {
      status: summary.failed > 0 ? 'completed_with_errors' : 'completed',
      sources_total: 1,
      fetched_total: submittedJobs.length,
      processed_total: summary.processed,
      pending_total: summary.pending,
      published_total: summary.published,
      failed_total: summary.failed,
      notes: summary.errors.join('\n') || null,
      finished_at: new Date().toISOString(),
    });

    return {
      success: true,
      processed: summary.processed,
      skipped: summary.skipped,
      reasons: summary.reasons,
    };
  } catch (error) {
    await updateAutomationRun(run.id, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      sources_total: 1,
      fetched_total: submittedJobs.length,
      processed_total: summary.processed,
      pending_total: summary.pending,
      published_total: summary.published,
      failed_total: summary.failed + 1,
      notes: error instanceof Error ? error.message : 'Unknown manual upload failure',
    });

    throw error;
  }
}

export async function approveAutomationJob(id: string) {
  const { runtimeConfig } = await getEffectiveSettings();
  const job = await getAutomationJobById(id);

  if (!job) {
    throw new Error('Automation job not found.');
  }

  const approvedJob = await updateAutomationJob(id, {
    review_status: 'approved',
    reviewed_at: new Date().toISOString(),
    failure_reason: null,
  });

  await createAutomationEvent({
    automation_job_id: approvedJob.id,
    level: 'info',
    step: 'review',
    message: 'Job approved for publishing.',
    payload: toJson({}),
  });

  if (!runtimeConfig.autoPostEnabled) {
    return approvedJob;
  }

  const publishResult = await publishJobRecord(approvedJob, null, false);
  return publishResult.job;
}

export async function rejectAutomationJob(id: string, reason?: string) {
  const job = await getAutomationJobById(id);
  if (!job) {
    throw new Error('Automation job not found.');
  }

  const rejectedJob = await updateAutomationJob(id, {
    review_status: 'rejected',
    publish_status: 'skipped',
    reviewed_at: new Date().toISOString(),
    failure_reason: reason || 'Rejected by admin reviewer.',
  });

  await createAutomationEvent({
    automation_job_id: rejectedJob.id,
    level: 'info',
    step: 'review',
    message: 'Job rejected during review.',
    payload: toJson({
      reason: reason || 'Rejected by admin reviewer.',
    }),
  });

  return rejectedJob;
}

export async function publishAutomationJob(id: string) {
  const job = await getAutomationJobById(id);
  if (!job) {
    throw new Error('Automation job not found.');
  }

  const publishResult = await publishJobRecord(job, null, true);
  return publishResult.job;
}

export async function scheduleSingleAutomationJob(id: string, scheduledAt: string) {
  const job = await getAutomationJobById(id);
  if (!job) {
    throw new Error('Automation job not found.');
  }

  if (job.review_status === 'rejected') {
    throw new Error('Rejected jobs cannot be scheduled for publishing.');
  }

  const parsed = new Date(scheduledAt);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid scheduled publish time.');
  }

  const updatedJob = await updateAutomationJob(job.id, {
    review_status: job.review_status === 'pending' ? 'approved' : job.review_status,
    reviewed_at: job.review_status === 'pending' ? new Date().toISOString() : job.reviewed_at,
    publish_status: 'queued',
    scheduled_publish_at: parsed.toISOString(),
  });

  return updatedJob;
}

export async function cancelScheduledAutomationJob(id: string) {
  const job = await getAutomationJobById(id);
  if (!job) {
    throw new Error('Automation job not found.');
  }

  if (job.publish_status !== 'queued') {
    throw new Error('Only queued jobs can be unscheduled.');
  }

  const updatedJob = await updateAutomationJob(job.id, {
    publish_status: 'draft',
    scheduled_publish_at: null,
  });

  return updatedJob;
}

export async function deleteRejectedAutomationJob(id: string) {
  const job = await getAutomationJobById(id);
  if (!job) {
    throw new Error('Automation job not found.');
  }

  if (job.review_status !== 'rejected') {
    throw new Error('Only rejected jobs can be permanently deleted.');
  }

  await deleteAutomationJobById(id);
  return { id };
}

export async function scheduleAutomationJobPublishing(startAt: string, intervalHours = 3) {
  const parsedStart = new Date(startAt);
  if (Number.isNaN(parsedStart.getTime())) {
    throw new Error('Invalid publish start time.');
  }

  const jobs = await listAutomationJobsForScheduling();
  let scheduledCount = 0;

  for (const [index, job] of jobs.entries()) {
    const scheduledAt = new Date(parsedStart.getTime() + index * intervalHours * 60 * 60 * 1000);
    await updateAutomationJob(job.id, {
      publish_status: 'queued',
      scheduled_publish_at: scheduledAt.toISOString(),
    });
    scheduledCount += 1;
  }

  return { scheduled: scheduledCount };
}

export async function publishScheduledAutomationJobs(limit = 1) {
  const dueJobs = await listDueScheduledAutomationJobs(limit);
  let published = 0;
  let failed = 0;

  for (const job of dueJobs) {
    try {
      const result = await publishJobRecord(job, null, false);
      if (result.failed) {
        failed += 1;
      } else {
        published += 1;
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : 'Scheduled publish failed.';

      await updateAutomationJob(job.id, {
        review_status: 'failed',
        publish_status: 'failed',
        failure_reason: message,
        scheduled_publish_at: null,
        last_attempt_at: new Date().toISOString(),
      });

      await createAutomationEvent({
        automation_job_id: job.id,
        run_id: null,
        level: 'error',
        step: 'publish',
        message: 'Scheduled publish failed.',
        payload: toJson({ error: message }),
      });
    }
  }

  return { published, failed, total: dueJobs.length };
}

export async function getAutomationDashboard(limit = 40) {
  const { settings } = await getEffectiveSettings();
  const [jobs, runs] = await Promise.all([listAutomationJobs(limit), listAutomationRuns(10)]);

  return {
    settings,
    jobs,
    runs,
  };
}

export async function updateAutomationSettings(values: Partial<AutomationSettingsRow>) {
  return upsertAutomationSettings({
    id: 'default',
    ...values,
  });
}

