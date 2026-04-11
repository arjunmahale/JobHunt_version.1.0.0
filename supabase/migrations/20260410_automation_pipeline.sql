create extension if not exists pgcrypto;

create table if not exists public.automation_settings (
  id text primary key default 'default',
  review_required boolean not null default true,
  auto_post_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  telegram_enabled boolean not null default false,
  schedule_cron text not null default '0 9 * * *',
  max_jobs_per_run integer not null default 25,
  updated_at timestamptz not null default now()
);

insert into public.automation_settings (
  id,
  review_required,
  auto_post_enabled,
  whatsapp_enabled,
  telegram_enabled,
  schedule_cron,
  max_jobs_per_run
)
values ('default', true, false, false, false, '0 9 * * *', 25)
on conflict (id) do nothing;

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null,
  status text not null default 'running',
  sources_total integer not null default 0,
  fetched_total integer not null default 0,
  processed_total integer not null default 0,
  pending_total integer not null default 0,
  published_total integer not null default 0,
  failed_total integer not null default 0,
  notes text null,
  started_at timestamptz not null default now(),
  finished_at timestamptz null
);

create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null,
  source_url text not null,
  external_id text null,
  raw_title text null,
  raw_company text null,
  raw_location text null,
  raw_payload jsonb not null default '{}'::jsonb,
  description_raw text null,
  extracted_payload jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  title text not null,
  company text not null,
  location text null,
  salary text null,
  description text not null,
  apply_link text not null,
  category text not null default 'Technology',
  slug text not null,
  job_type text not null default 'Full Time',
  experience_level text not null default '',
  roles_responsibilities text not null default '',
  eligibility_criteria text not null default '',
  required_skills text not null default '',
  how_to_apply text not null default '',
  application_deadline date null,
  work_mode text null,
  number_of_openings integer null,
  about_company text null,
  whatsapp_message text null,
  telegram_message text null,
  review_status text not null default 'pending',
  publish_status text not null default 'draft',
  failure_reason text null,
  duplicate_of_job_id uuid null references public.jobs(id) on delete set null,
  published_job_id uuid null references public.jobs(id) on delete set null,
  ai_model text null,
  source_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  published_at timestamptz null,
  last_attempt_at timestamptz null,
  constraint automation_jobs_review_status_check check (
    review_status in ('pending', 'approved', 'rejected', 'published', 'failed')
  ),
  constraint automation_jobs_publish_status_check check (
    publish_status in ('draft', 'queued', 'published', 'failed', 'skipped')
  )
);

create unique index if not exists automation_jobs_source_hash_key
  on public.automation_jobs (source_hash);

create index if not exists automation_jobs_review_status_idx
  on public.automation_jobs (review_status, created_at desc);

create index if not exists automation_jobs_title_company_idx
  on public.automation_jobs (title, company);

create table if not exists public.automation_job_events (
  id uuid primary key default gen_random_uuid(),
  automation_job_id uuid null references public.automation_jobs(id) on delete cascade,
  run_id uuid null references public.automation_runs(id) on delete set null,
  level text not null default 'info',
  step text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists automation_job_events_job_idx
  on public.automation_job_events (automation_job_id, created_at desc);

create index if not exists automation_job_events_run_idx
  on public.automation_job_events (run_id, created_at desc);

create table if not exists public.automation_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  automation_job_id uuid not null references public.automation_jobs(id) on delete cascade,
  channel text not null,
  recipient text not null,
  provider text not null,
  status text not null,
  provider_message_id text null,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text null,
  created_at timestamptz not null default now()
);

create index if not exists automation_delivery_logs_job_idx
  on public.automation_delivery_logs (automation_job_id, created_at desc);
