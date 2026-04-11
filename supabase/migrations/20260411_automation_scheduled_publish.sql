alter table public.automation_jobs
  add column if not exists scheduled_publish_at timestamptz null;

create index if not exists automation_jobs_scheduled_publish_idx
  on public.automation_jobs (scheduled_publish_at);
