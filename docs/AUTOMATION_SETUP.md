# Automation Setup Guide

## Project Overview

The application is a Next.js 14 App Router project backed by Supabase. Public job pages continue to read from the existing `jobs` table. The new automation layer fetches raw jobs from configured sources, runs AI extraction, validates and deduplicates them, stores them as review candidates, and publishes approved jobs into `jobs`.

## Architecture Diagram

```text
Configured Sources
  -> fetch raw jobs
  -> AI extraction / fallback extraction
  -> validation + normalization
  -> duplicate detection
  -> unique slug generation
  -> automation_jobs (pending / approved / rejected / published / failed)
  -> admin review UI or auto-post logic
  -> jobs table (published website data)
  -> Twilio WhatsApp delivery
  -> Telegram Bot API delivery
  -> automation_runs / automation_job_events / automation_delivery_logs
```

## Folder Structure

```text
app/
  admin/
    automation/
  api/
    automation/
    jobs/
    search/
components/
  AdminNav.tsx
lib/
  automation/
    ai.ts
    delivery.ts
    env.ts
    messages.ts
    normalize.ts
    pipeline.ts
    sources.ts
    store.ts
    types.ts
    utils.ts
supabase/
  migrations/
scripts/
  automation-trigger.mjs
  automation-scheduler.mjs
docs/
  AUTOMATION_SETUP.md
```

## Backend Setup

1. Install dependencies with `npm install`.
2. Copy [.env.example](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/.env.example) to `.env.local`.
3. Start the app with `npm run dev`.

## Supabase Setup

1. Open the Supabase SQL editor.
2. Run [20260410_automation_pipeline.sql](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/supabase/migrations/20260410_automation_pipeline.sql).
3. Confirm these new tables exist:
   - `automation_settings`
   - `automation_runs`
   - `automation_jobs`
   - `automation_job_events`
   - `automation_delivery_logs`

## OpenAI API Setup

1. Set `OPENAI_API_KEY`.
2. Set `OPENAI_MODEL`.
3. The pipeline uses OpenAI structured extraction first and falls back to heuristic parsing if the key is absent or the request fails.

## Twilio Setup

1. Enable the Twilio WhatsApp sandbox or a production sender.
2. Set:
   - `WHATSAPP_ENABLED=true`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM`
   - `WHATSAPP_RECIPIENTS`

## Telegram Bot Setup

1. Create a Telegram bot with BotFather.
2. Add the bot to your target group or channel.
3. Set:
   - `TELEGRAM_ENABLED=true`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_IDS`

## Environment Variables

Core:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Automation:

- `AUTOMATION_API_SECRET`
- `AUTOMATION_REVIEW_REQUIRED`
- `AUTOMATION_AUTO_POST_ENABLED`
- `AUTOMATION_CRON_SCHEDULE`
- `AUTOMATION_MAX_JOBS_PER_RUN`
- `JOB_SOURCE_CONFIG_JSON`

AI and channels:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WHATSAPP_ENABLED`
- `WHATSAPP_RECIPIENTS`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TELEGRAM_ENABLED`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_IDS`

## How Job Scraping Works

The pipeline reads `JOB_SOURCE_CONFIG_JSON` and uses the `type` field to select a fetcher:

- `greenhouse`: for Greenhouse board APIs
- `lever`: for Lever posting APIs
- `json`: for custom JSON feeds
- `html`: for company career pages with selector-based extraction
- `linkedin`, `indeed`, `naukri`: selector-driven scraping presets for those source types

Each fetched record is converted into a `RawFetchedJob`, optionally enriched from its detail page, and then handed to the extraction stage.

## How AI Extraction Works

The pipeline sends each raw job payload to OpenAI using a structured JSON schema. If OpenAI is unavailable, it falls back to a deterministic extractor built from the raw source fields and keyword heuristics.

Extracted output includes:

- `title`
- `company`
- `location`
- `experience`
- `skills`
- `apply_link`
- `description`
- `salary`
- `job_type`
- `category`
- `work_mode`
- `about_company`
- `roles_responsibilities`
- `eligibility_criteria`
- `how_to_apply`
- `application_deadline`
- `number_of_openings`

## How Validation Works

After extraction, the pipeline:

1. Normalizes whitespace and URLs.
2. Fills missing values with safe defaults.
3. Dedupe-checks `title + company` against published jobs and open automation jobs.
4. Generates a unique slug.
5. Builds WhatsApp and Telegram messages.

## How Posting Works

Published jobs follow this path:

1. Candidate lands in `automation_jobs`.
2. Admin approves it or auto-post publishes it immediately.
3. The job is inserted into `jobs`.
4. WhatsApp delivery runs through Twilio.
5. Telegram delivery runs through the Bot API.
6. Delivery attempts are logged in `automation_delivery_logs`.

## Review and Approval Workflow

States:

- `pending`: waiting for human review
- `approved`: approved but not yet published
- `rejected`: rejected by reviewer
- `published`: inserted into `jobs` and delivery completed
- `failed`: publishing or delivery encountered errors

Use `/admin/automation` to:

- run a dry run
- run a full ingestion
- approve candidates
- reject candidates
- publish approved or failed candidates again
- edit automation settings

## Running the Scheduler

Local scheduler:

```bash
npm run automation:scheduler
```

One-off run:

```bash
npm run automation:run
```

Dry run:

```bash
npm run automation:dry-run
```

The scheduler script uses `AUTOMATION_CRON_SCHEDULE` and securely calls `POST /api/automation/run` with `AUTOMATION_API_SECRET`.

For Vercel-native scheduling and deployment, use [VERCEL_DEPLOYMENT_STEP_BY_STEP.md](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/docs/VERCEL_DEPLOYMENT_STEP_BY_STEP.md).

## API Endpoints

- `GET /api/automation/jobs`
- `POST /api/automation/run`
- `GET /api/automation/settings`
- `PATCH /api/automation/settings`
- `POST /api/automation/jobs/:id/approve`
- `POST /api/automation/jobs/:id/reject`
- `POST /api/automation/jobs/:id/publish`
- `GET /api/search`

## Example Test Flow

1. Apply the Supabase migration.
2. Configure one small source in `JOB_SOURCE_CONFIG_JSON`.
3. Set `AUTOMATION_REVIEW_REQUIRED=true`.
4. Set `AUTOMATION_AUTO_POST_ENABLED=false`.
5. Run `npm run automation:dry-run`.
6. Run `npm run automation:run`.
7. Open `/admin/automation`.
8. Approve a pending job.
9. Publish it.
10. Verify the new row appears in `jobs` and in the public `/jobs` listing.

## Scaling Guidance

- Prefer JSON or ATS API sources over HTML scraping whenever possible.
- Use multiple smaller source configs instead of one giant mixed scraper.
- Keep `AUTOMATION_MAX_JOBS_PER_RUN` low at first.
- Move scheduler execution to a dedicated process or platform cron in production.
- Add batching or queue workers if source count becomes large.
- Consider moving delivery retries to a background worker if message volume grows.

## Troubleshooting

- `Missing automation relation`: apply the Supabase migration file.
- `No job sources configured`: fill `JOB_SOURCE_CONFIG_JSON`.
- `Unauthorized` on scheduler runs: check `AUTOMATION_API_SECRET`.
- `OpenAI extraction failed`: verify `OPENAI_API_KEY` and `OPENAI_MODEL`; fallback extraction still runs.
- `WhatsApp delivery failed`: verify Twilio sandbox setup, sender number, and recipient format.
- `Telegram delivery failed`: verify bot token, chat ID, and bot membership in the target channel/group.
- Jobs not visible on the public site: confirm the candidate was actually published into `jobs`, not left in `pending` or `approved`.
