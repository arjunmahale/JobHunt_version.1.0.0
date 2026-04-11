# Vercel Deployment Step By Step

## What This File Covers

This guide is the practical checklist for taking JobHunt from local development to a working Vercel production deployment with:

- Supabase connected
- OpenAI extraction configured
- optional Twilio WhatsApp delivery
- optional Telegram delivery
- Vercel cron automation enabled
- step-by-step testing before and after go-live

## Before You Start

You should already have:

1. A GitHub repository for this project
2. A Supabase project
3. An OpenAI API key
4. Optional:
   - Twilio WhatsApp credentials
   - Telegram bot token and chat IDs
5. A Vercel account

## Step 1: Prepare Supabase

1. Open your Supabase project dashboard.
2. Go to the SQL Editor.
3. Run [20260410_automation_pipeline.sql](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/supabase/migrations/20260410_automation_pipeline.sql).
4. Confirm these tables now exist:
   - `jobs`
   - `contact_messages`
   - `automation_settings`
   - `automation_runs`
   - `automation_jobs`
   - `automation_job_events`
   - `automation_delivery_logs`
5. Copy these values from Supabase:
   - Project URL
   - Anon key
   - Service role key

## Step 2: Prepare Environment Variables

Use [.env.example](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/.env.example) as your source of truth.

Minimum required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AUTOMATION_API_SECRET`
- `CRON_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `JOB_SOURCE_CONFIG_JSON`

Optional channel variables:

- `WHATSAPP_ENABLED`
- `WHATSAPP_RECIPIENTS`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TELEGRAM_ENABLED`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_IDS`

## Step 3: Configure Job Sources

The automation system reads `JOB_SOURCE_CONFIG_JSON`.

Example source set:

```json
[
  {
    "id": "openai-greenhouse",
    "name": "OpenAI Greenhouse",
    "type": "greenhouse",
    "url": "https://boards-api.greenhouse.io/v1/boards/openai/jobs?content=true",
    "company": "OpenAI",
    "category": "Technology",
    "enabled": true,
    "maxItems": 10
  },
  {
    "id": "example-careers-html",
    "name": "Example Careers",
    "type": "html",
    "url": "https://example.com/careers",
    "company": "Example Inc",
    "category": "Technology",
    "enabled": false,
    "maxItems": 10,
    "selectors": {
      "card": ".job-card",
      "title": ".job-title",
      "company": ".company",
      "location": ".location",
      "link": "a",
      "description": ".job-summary"
    },
    "detailSelectors": {
      "description": ".job-description",
      "applyLink": "a.apply-button"
    }
  }
]
```

Use API feeds first when possible. HTML scraping should be your fallback because selector drift is the most common failure point.

## Step 4: Local Configuration and Local Test

1. Create `.env.local`.
2. Copy values from [.env.example](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/.env.example).
3. Run:

```bash
npm install
npm run type-check
npm run dev
```

4. Open `http://localhost:3000/admin/login`.
5. Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
6. Open `http://localhost:3000/admin/automation`.

## Step 5: Local Testing Step By Step

### Test A: Dry Run

1. Click `Dry Run` in `/admin/automation`.
2. Confirm the response mentions fetched and processed jobs.
3. Confirm no public `jobs` rows were added during the dry run.

### Test B: Real Ingestion with Review Enabled

1. Keep:
   - `AUTOMATION_REVIEW_REQUIRED=true`
   - `AUTOMATION_AUTO_POST_ENABLED=false`
2. Click `Run Now`.
3. Confirm records appear in the automation table view on `/admin/automation`.
4. Confirm status is `pending`.

### Test C: Manual Approval

1. In `/admin/automation`, click `Approve` for one pending job.
2. Confirm review status changes to `approved`.
3. Click `Publish`.
4. Confirm:
   - the automation row becomes `published` or `failed`
   - the new record appears on `/jobs`
   - the public detail page opens correctly

### Test D: Search and Public Flow

1. Visit `/jobs`.
2. Search for the newly published job.
3. Open the detail page.
4. Confirm:
   - slug works
   - apply link opens
   - description renders

### Test E: WhatsApp and Telegram

1. Set:
   - `WHATSAPP_ENABLED=true` only if Twilio is ready
   - `TELEGRAM_ENABLED=true` only if your bot is ready
2. Publish one approved job.
3. Confirm the message arrives.
4. If delivery fails, review:
   - `/admin/automation`
   - `automation_delivery_logs`

## Step 6: Push to GitHub

1. Commit your changes.
2. Push to your GitHub repository.
3. Confirm the branch you want to deploy is ready.

## Step 7: Create the Vercel Project

According to Vercel’s current Next.js deployment docs, the standard path is to import the Git repo or run the `vercel` command from the project root. Vercel auto-detects Next.js for deployment.

Do this in the dashboard:

1. Go to `https://vercel.com`.
2. Click `Add New Project`.
3. Import your GitHub repository.
4. Confirm these settings:
   - Framework preset: `Next.js`
   - Root directory: repo root
   - Build command: default or `next build`
   - Output directory: default
5. Click `Deploy`.

## Step 8: Add Vercel Environment Variables

Vercel’s current environment-variable docs say you add variables in Project Settings and redeploy after changes because changes only apply to new deployments.

In Vercel:

1. Open your project.
2. Go to `Settings`.
3. Open `Environment Variables`.
4. Add all required values from Step 2.
5. Add them for:
   - `Production`
   - `Preview`
   - `Development` if you use `vercel dev`

Recommended production set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AUTOMATION_API_SECRET`
- `CRON_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AUTOMATION_REVIEW_REQUIRED`
- `AUTOMATION_AUTO_POST_ENABLED`
- `AUTOMATION_MAX_JOBS_PER_RUN`
- `JOB_SOURCE_CONFIG_JSON`

Optional:

- `WHATSAPP_ENABLED`
- `WHATSAPP_RECIPIENTS`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TELEGRAM_ENABLED`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_IDS`

After changing variables, redeploy the project.

## Step 9: Configure `NEXT_PUBLIC_APP_URL`

Set `NEXT_PUBLIC_APP_URL` to your real production URL:

- first deployment: `https://your-project.vercel.app`
- later: your custom domain, for example `https://jobs.example.com`

This matters for SEO URLs, structured metadata, and message links.

## Step 10: Vercel Cron Setup

This repo now includes [vercel.json](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/vercel.json) with a cron entry that calls [app/api/cron/automation/route.ts](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/app/api/cron/automation/route.ts).

Important notes from the current Vercel docs:

- cron jobs are configured in `vercel.json`
- Vercel cron sends an HTTP `GET`
- cron jobs only run on production deployments
- the timezone is always UTC
- `CRON_SECRET` is sent automatically as an `Authorization` header when configured

Default repo cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/automation",
      "schedule": "0 9 * * *"
    }
  ]
}
```

If you want a different schedule:

1. Edit [vercel.json](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/vercel.json).
2. Change the cron expression.
3. Redeploy.

Example:

- `0 9 * * *` means every day at 09:00 UTC
- `30 3 * * *` means every day at 03:30 UTC

## Step 11: First Production Validation on Vercel

After deployment:

1. Open the production site.
2. Log into `/admin/login`.
3. Open `/admin/automation`.
4. Run a `Dry Run`.
5. Run `Run Now`.
6. Confirm jobs enter the review queue.
7. Approve one job.
8. Publish one job.
9. Confirm the job is visible on the live `/jobs` page.

## Step 12: Test the Cron Route Manually

Before waiting for the real schedule, test the Vercel cron endpoint manually.

Use a request like this:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-project.vercel.app/api/cron/automation
```

Expected result:

- HTTP 200
- JSON response containing `ok: true`
- a new row in `automation_runs`

## Step 13: Verify Vercel Cron in Dashboard

Current Vercel cron docs say cron jobs are visible in Project Settings.

Check:

1. Vercel project
2. `Settings`
3. `Cron Jobs`
4. Confirm the path `/api/cron/automation` is listed
5. Confirm the schedule is correct

## Step 14: Production Testing Checklist

Run this full checklist after go-live:

1. Visit the home page and `/jobs`
2. Create a manual job from `/admin/jobs/new`
3. Confirm new fields persist correctly
4. Run automation dry run
5. Run live automation
6. Review pending automation candidates
7. Approve and publish one job
8. Confirm public slug resolves
9. Confirm WhatsApp delivery if enabled
10. Confirm Telegram delivery if enabled
11. Confirm `automation_runs` logs update
12. Confirm `automation_job_events` logs update
13. Confirm `automation_delivery_logs` update

## Step 15: Recommended Production Settings

Safer first rollout:

- `AUTOMATION_REVIEW_REQUIRED=true`
- `AUTOMATION_AUTO_POST_ENABLED=false`
- `WHATSAPP_ENABLED=false`
- `TELEGRAM_ENABLED=false`

After stable testing:

- enable Telegram first
- then enable WhatsApp
- finally enable `AUTOMATION_AUTO_POST_ENABLED=true` if you trust the source quality

## Step 16: Common Vercel Deployment Problems

### Build succeeds but automation pages fail

Cause:
- migration not applied

Fix:
- run [20260410_automation_pipeline.sql](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/supabase/migrations/20260410_automation_pipeline.sql)

### Production deploy uses old env values

Cause:
- Vercel only applies updated env vars to new deployments

Fix:
- redeploy after every env change

### Cron route returns 401

Cause:
- `CRON_SECRET` is missing or incorrect

Fix:
- set `CRON_SECRET` in Vercel
- redeploy
- test with `curl`

### Cron exists but never runs

Cause:
- preview deployment instead of production
- wrong path
- old `vercel.json`

Fix:
- deploy to production
- confirm [vercel.json](/c:/Users/DELL/Documents/Github/JobHunt_version.1.0.0/vercel.json) is in the repo root
- verify cron entry in Vercel Settings

### Source fetches fail in production

Cause:
- source site blocks scraping
- selectors changed

Fix:
- prefer JSON or ATS APIs
- lower `maxItems`
- update source selectors

### OpenAI extraction fails

Cause:
- bad API key or unsupported model name

Fix:
- verify `OPENAI_API_KEY`
- verify `OPENAI_MODEL`
- check Vercel function logs

## Step 17: Suggested Launch Sequence

1. Deploy to Vercel
2. Add env vars
3. Apply Supabase migration
4. Redeploy
5. Test `/admin/login`
6. Test `/admin/automation`
7. Run dry run
8. Run live ingestion
9. Approve and publish one job manually
10. Verify public jobs page
11. Test cron endpoint manually
12. Wait for one scheduled cron run
13. Enable channel posting
14. Enable full auto-post only after review confidence is high
