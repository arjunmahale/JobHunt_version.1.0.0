import { slugify } from '@/lib/slugify';
import { supabaseServer } from '@/lib/supabase';
import { findJobByTitleAndCompany } from '@/lib/jobs';
import {
  AutomationDeliveryInsert,
  AutomationJobEventInsert,
  AutomationJobInsert,
  AutomationJobRow,
  AutomationRunRow,
  AutomationSettingsInsert,
  AutomationSettingsRow,
} from './types';

const AUTOMATION_SETTINGS_ID = 'default';
const MIGRATION_HINT =
  'Apply supabase/migrations/20260410_automation_pipeline.sql to your Supabase project before using automation routes.';

function normalizeAutomationError(error: unknown, relation: string): Error {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code || '');
    const message = String((error as { message?: string }).message || '');

    if (code === 'PGRST205' || code === '42P01') {
      return new Error(`Missing automation relation "${relation}". ${MIGRATION_HINT}`);
    }

    return new Error(message || `Supabase request failed for ${relation}`);
  }

  return error instanceof Error ? error : new Error(`Unknown automation error for ${relation}`);
}

export async function getAutomationSettings() {
  const { data, error } = await supabaseServer
    .from('automation_settings')
    .select('*')
    .eq('id', AUTOMATION_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    throw normalizeAutomationError(error, 'automation_settings');
  }

  return (data || null) as AutomationSettingsRow | null;
}

export async function upsertAutomationSettings(settings: AutomationSettingsInsert) {
  const { data, error } = await supabaseServer
    .from('automation_settings')
    .upsert(
      [
        {
          id: AUTOMATION_SETTINGS_ID,
          ...settings,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    throw normalizeAutomationError(error, 'automation_settings');
  }

  return data as AutomationSettingsRow;
}

export async function createAutomationRun(trigger: string) {
  const { data, error } = await supabaseServer
    .from('automation_runs')
    .insert([
      {
        trigger,
        status: 'running',
        started_at: new Date().toISOString(),
      },
    ])
    .select('*')
    .single();

  if (error) {
    throw normalizeAutomationError(error, 'automation_runs');
  }

  return data as AutomationRunRow;
}

export async function updateAutomationRun(id: string, updates: Partial<AutomationRunRow>) {
  const { data, error } = await supabaseServer
    .from('automation_runs')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw normalizeAutomationError(error, 'automation_runs');
  }

  return data as AutomationRunRow;
}

export async function listAutomationRuns(limit = 10) {
  const { data, error } = await supabaseServer
    .from('automation_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw normalizeAutomationError(error, 'automation_runs');
  }

  return (data || []) as AutomationRunRow[];
}

export async function listAutomationJobs(limit = 50) {
  const { data, error } = await supabaseServer
    .from('automation_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }

  return (data || []) as AutomationJobRow[];
}

export async function listAutomationJobsForScheduling() {
  const { data, error } = await supabaseServer
    .from('automation_jobs')
    .select('*')
    .eq('review_status', 'approved')
    .in('publish_status', ['draft', 'queued'])
    .is('published_job_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }

  return (data || []) as AutomationJobRow[];
}

export async function listDueScheduledAutomationJobs(limit = 1) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseServer
    .from('automation_jobs')
    .select('*')
    .eq('review_status', 'approved')
    .in('publish_status', ['draft', 'queued'])
    .is('published_job_id', null)
    .lte('scheduled_publish_at', now)
    .order('scheduled_publish_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }

  return (data || []) as AutomationJobRow[];
}

export async function listQueuedScheduledAutomationJobs(limit = 1) {
  const { data, error } = await supabaseServer
    .from('automation_jobs')
    .select('*')
    .eq('review_status', 'approved')
    .eq('publish_status', 'queued')
    .is('published_job_id', null)
    .not('scheduled_publish_at', 'is', null)
    .order('scheduled_publish_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }

  return (data || []) as AutomationJobRow[];
}

export async function getAutomationJobById(id: string) {
  const { data, error } = await supabaseServer
    .from('automation_jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }

  return (data || null) as AutomationJobRow | null;
}

export async function getAutomationJobBySourceHash(sourceHash: string) {
  const { data, error } = await supabaseServer
    .from('automation_jobs')
    .select('*')
    .eq('source_hash', sourceHash)
    .maybeSingle();

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }

  return (data || null) as AutomationJobRow | null;
}

export async function findOpenAutomationDuplicate(title: string, company: string) {
  const { data, error } = await supabaseServer
    .from('automation_jobs')
    .select('*')
    .ilike('title', title.trim())
    .ilike('company', company.trim())
    .in('review_status', ['pending', 'approved', 'published'])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }

  return (data || null) as AutomationJobRow | null;
}

export async function upsertAutomationJob(job: AutomationJobInsert) {
  const now = new Date().toISOString();

  const { data, error } = await supabaseServer
    .from('automation_jobs')
    .upsert(
      [
        {
          ...job,
          updated_at: now,
          created_at: job.created_at || now,
        },
      ],
      { onConflict: 'source_hash' }
    )
    .select('*')
    .single();

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }

  return data as AutomationJobRow;
}

export async function updateAutomationJob(id: string, updates: Partial<AutomationJobRow>) {
  const { data, error } = await supabaseServer
    .from('automation_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }

  return data as AutomationJobRow;
}

export async function deleteAutomationJobById(id: string) {
  const deliveryResult = await supabaseServer
    .from('automation_delivery_logs')
    .delete()
    .eq('automation_job_id', id);

  if (deliveryResult.error) {
    throw normalizeAutomationError(deliveryResult.error, 'automation_delivery_logs');
  }

  const eventResult = await supabaseServer
    .from('automation_job_events')
    .delete()
    .eq('automation_job_id', id);

  if (eventResult.error) {
    throw normalizeAutomationError(eventResult.error, 'automation_job_events');
  }

  const { error } = await supabaseServer
    .from('automation_jobs')
    .delete()
    .eq('id', id);

  if (error) {
    throw normalizeAutomationError(error, 'automation_jobs');
  }
}

export async function createAutomationEvent(event: AutomationJobEventInsert) {
  const { error } = await supabaseServer
    .from('automation_job_events')
    .insert([
      {
        ...event,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    throw normalizeAutomationError(error, 'automation_job_events');
  }
}

export async function createDeliveryLog(entry: AutomationDeliveryInsert) {
  const { error } = await supabaseServer
    .from('automation_delivery_logs')
    .insert([
      {
        ...entry,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    throw normalizeAutomationError(error, 'automation_delivery_logs');
  }
}

export async function findPublishedDuplicate(title: string, company: string) {
  return findJobByTitleAndCompany(title, company);
}

async function slugExists(slug: string) {
  const [jobResult, automationResult] = await Promise.all([
    supabaseServer
      .from('jobs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle(),
    supabaseServer
      .from('automation_jobs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle(),
  ]);

  if (jobResult.error) {
    throw normalizeAutomationError(jobResult.error, 'jobs');
  }

  if (automationResult.error) {
    throw normalizeAutomationError(automationResult.error, 'automation_jobs');
  }

  return Boolean(jobResult.data || automationResult.data);
}

export async function generateUniquePipelineSlug(title: string) {
  const baseSlug = slugify(title) || 'job';
  let candidate = baseSlug;
  let counter = 1;

  while (await slugExists(candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}
