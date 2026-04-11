# JobHunt Automation Platform

JobHunt now supports two parallel workflows:

1. Manual admin CRUD for published jobs.
2. An automated ingestion pipeline that fetches jobs, extracts structured data, stores candidates in a review queue, and publishes approved jobs to the website, WhatsApp, and Telegram.

The public site still reads from the existing `jobs` table, so current job pages continue to work while automation runs in a separate review layer.

## Main Features

- Config-driven job source ingestion for `greenhouse`, `lever`, `json`, `html`, `linkedin`, `indeed`, and `naukri`
- OpenAI-based structured extraction with a fallback heuristic extractor
- Duplicate detection based on `title + company`
- Unique slug generation using the existing app logic
- Review queue with `pending`, `approved`, `rejected`, `published`, and `failed` states
- WhatsApp posting through Twilio
- Telegram posting through the Telegram Bot API
- Run logs and delivery logs stored in Supabase
- Manual trigger, dry run, and cron-based scheduler support

## Important Setup

1. Copy [.env.example](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/.env.example) into `.env.local` and fill in real secrets.
2. Apply [20260410_automation_pipeline.sql](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/supabase/migrations/20260410_automation_pipeline.sql) to your Supabase project.
3. Start the app with `npm run dev`.
4. Open `/admin/automation` to review jobs and run the pipeline.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run type-check`
- `npm run automation:run`
- `npm run automation:dry-run`
- `npm run automation:scheduler`

## Docs

Full setup, architecture, scaling, and troubleshooting live in [AUTOMATION_SETUP.md](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/docs/AUTOMATION_SETUP.md).

Vercel deployment, cron setup, and step-by-step production testing live in [VERCEL_DEPLOYMENT_STEP_BY_STEP.md](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/docs/VERCEL_DEPLOYMENT_STEP_BY_STEP.md).
