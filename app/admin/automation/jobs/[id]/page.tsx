'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type EditableAutomationJob = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  experience_level: string;
  salary: string | null;
  description: string;
  apply_link: string;
  slug: string;
  category: string;
  job_type: string;
  work_mode: string | null;
  required_skills: string;
  roles_responsibilities: string;
  eligibility_criteria: string;
  how_to_apply: string;
  about_company: string | null;
  application_deadline: string | null;
  number_of_openings: number | null;
  review_status: string;
  publish_status: string;
  created_at: string;
};

type JobApiResponse = {
  job?: EditableAutomationJob;
  published_slug?: string | null;
  error?: string;
};

function toStringValue(value: string | null | undefined, fallback = '') {
  return String(value ?? fallback);
}

function buildPreviewMessage(values: Record<string, string>) {
  const company = values.company || 'Unknown Company';
  const title = values.title || 'IT Role';
  const experience = values.experience_level || '0-2 Years';
  const location = values.location || 'India';
  const salary = values.salary || 'Not Disclosed';
  const slug = values.slug || '';
  const jobUrl = slug
    ? `https://jobhuntportal.vercel.app/jobs/${slug}`
    : 'https://jobhuntportal.vercel.app/jobs';

  return [
    `\u{1F680} ${company} Hiring 2026`,
    '',
    `\u{1F3E2} Company: ${company}`,
    `\u{1F4CC} Role: ${title}`,
    '\u{1F393} Qualification: CS/IT Graduate',
    `\u{1F4BC} Experience: ${experience}`,
    `\u{1F4CD} Location: ${location}`,
    `\u{1F4B0} Salary: ${salary}`,
    '',
    `\u{1F449} Apply here: ${jobUrl}`,
    '',
    `\u{1F449} Share with friends \u{1F680}`,
  ].join('\n');
}

export default function AutomationJobEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [publishStatus, setPublishStatus] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [publishedSlug, setPublishedSlug] = useState('');
  const [scheduleAt, setScheduleAt] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  });
  const [form, setForm] = useState<Record<string, string>>({
    title: '',
    company: '',
    location: '',
    experience_level: '0-2 Years',
    salary: 'Not Disclosed',
    description: '',
    apply_link: '',
    slug: '',
    category: 'Technology',
    job_type: 'Full Time',
    work_mode: '',
    required_skills: '',
    roles_responsibilities: '',
    eligibility_criteria: '',
    how_to_apply: '',
    about_company: '',
    application_deadline: '',
    number_of_openings: '',
  });

  const loadJob = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/automation/jobs/${jobId}`, { cache: 'no-store' });
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = (await response.json()) as JobApiResponse;
      if (!response.ok || !data.job) {
        throw new Error(data.error || 'Failed to load automation job.');
      }

      setForm({
        title: toStringValue(data.job.title),
        company: toStringValue(data.job.company),
        location: toStringValue(data.job.location, 'India'),
        experience_level: toStringValue(data.job.experience_level, '0-2 Years'),
        salary: toStringValue(data.job.salary, 'Not Disclosed'),
        description: toStringValue(data.job.description),
        apply_link: toStringValue(data.job.apply_link),
        slug: toStringValue(data.job.slug),
        category: toStringValue(data.job.category, 'Technology'),
        job_type: toStringValue(data.job.job_type, 'Full Time'),
        work_mode: toStringValue(data.job.work_mode),
        required_skills: toStringValue(data.job.required_skills),
        roles_responsibilities: toStringValue(data.job.roles_responsibilities),
        eligibility_criteria: toStringValue(data.job.eligibility_criteria),
        how_to_apply: toStringValue(data.job.how_to_apply),
        about_company: toStringValue(data.job.about_company),
        application_deadline: toStringValue(data.job.application_deadline),
        number_of_openings: data.job.number_of_openings ? String(data.job.number_of_openings) : '',
      });
      setReviewStatus(data.job.review_status);
      setPublishStatus(data.job.publish_status);
      setCreatedAt(data.job.created_at);
      setPublishedSlug(toStringValue(data.published_slug));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load automation job.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const updateField = (name: string, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const saveJob = async () => {
    const response = await fetch(`/api/automation/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    });

    if (response.status === 401) {
      router.push('/admin/login');
      return false;
    }

    const data = (await response.json()) as JobApiResponse;
    if (!response.ok || !data.job) {
      throw new Error(data.error || 'Failed to save automation job.');
    }

    setReviewStatus(data.job.review_status);
    setPublishStatus(data.job.publish_status);
    return true;
  };

  const runAction = async (
    action: 'save' | 'approve' | 'reject' | 'publish' | 'schedule' | 'publish_now' | 'cancel_schedule'
  ) => {
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const saved = await saveJob();
      if (!saved) {
        return;
      }

      if (action === 'save') {
        setMessage('Job details saved.');
        return;
      }

      if (action === 'schedule') {
        const response = await fetch(`/api/automation/jobs/${jobId}/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ schedule_at: scheduleAt }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error || 'Failed to schedule publishing.');
        }

        setMessage('Job scheduled for publishing.');
        await loadJob();
        return;
      }

      if (action === 'publish_now') {
        const response = await fetch(`/api/automation/jobs/${jobId}/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ignore_schedule: true }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error || 'Failed to publish job.');
        }

        setMessage('Job published immediately.');
        await loadJob();
        return;
      }

      if (action === 'cancel_schedule') {
        const response = await fetch(`/api/automation/jobs/${jobId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'cancel_schedule' }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error || 'Failed to cancel scheduled publish.');
        }

        setMessage('Scheduled publish canceled.');
        await loadJob();
        return;
      }

      const endpoint = `/api/automation/jobs/${jobId}/${action}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: action === 'reject' ? JSON.stringify({ reason: 'Rejected by admin reviewer.' }) : undefined,
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} job.`);
      }

      setMessage(`Job saved and ${action}d successfully.`);
      await loadJob();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to update automation job.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runAction('save');
  };

  if (loading) {
    return <p className="py-12 text-center text-gray-600">Loading automation job...</p>;
  }

  const previewSlug = publishedSlug || form.slug;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-primary">Review & Edit Automation Job</h1>
          <p className="mt-2 text-sm text-gray-600">
            Update extracted fields before approval, rejection, or publishing.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Created: {createdAt ? new Date(createdAt).toLocaleString() : '-'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            Review: {reviewStatus || '-'}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            Publish: {publishStatus || '-'}
          </span>
          <Link
            href="/admin/automation"
            className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-slate-50"
          >
            Back to Queue
          </Link>
        </div>
      </div>

      {error && <div className="rounded bg-red-100 p-4 text-red-700">{error}</div>}
      {message && <div className="rounded bg-green-100 p-4 text-green-700">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid grid-cols-1 gap-4 rounded-xl bg-white p-6 shadow-lg md:grid-cols-2">
          {[
            ['title', 'Title'],
            ['company', 'Company'],
            ['location', 'Location'],
            ['experience_level', 'Experience'],
            ['salary', 'Salary'],
            ['apply_link', 'Apply Link'],
            ['slug', 'Slug (system generated)'],
            ['category', 'Category'],
            ['job_type', 'Job Type'],
            ['work_mode', 'Work Mode'],
            ['application_deadline', 'Application Deadline'],
            ['number_of_openings', 'Number of Openings'],
          ].map(([name, label]) => (
            <label key={name} className="text-sm font-medium text-gray-700">
              <span className="mb-2 block">{label}</span>
              <input
                type="text"
                value={name === 'slug' ? previewSlug : form[name]}
                onChange={(event) => updateField(name, event.target.value)}
                className="w-full rounded border px-3 py-2"
                readOnly={name === 'slug'}
              />
            </label>
          ))}
        </section>

        <section className="space-y-4 rounded-xl bg-white p-6 shadow-lg">
          {[
            ['description', 'Description'],
            ['required_skills', 'Required Skills (newline or comma separated)'],
            ['roles_responsibilities', 'Roles & Responsibilities'],
            ['eligibility_criteria', 'Eligibility Criteria'],
            ['how_to_apply', 'How to Apply'],
            ['about_company', 'About Company'],
          ].map(([name, label]) => (
            <label key={name} className="block text-sm font-medium text-gray-700">
              <span className="mb-2 block">{label}</span>
              <textarea
                value={form[name]}
                onChange={(event) => updateField(name, event.target.value)}
                className="min-h-[110px] w-full rounded border px-3 py-2"
              />
            </label>
          ))}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-bold text-primary">Telegram/WhatsApp Message Preview</h2>
          <pre className="mt-3 whitespace-pre-wrap rounded bg-slate-50 p-4 text-sm text-gray-700">
            {buildPreviewMessage({ ...form, slug: previewSlug })}
          </pre>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-lg">
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-primary px-5 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => runAction('approve')}
              disabled={saving}
              className="rounded bg-green-600 px-5 py-2 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              Save & Approve
            </button>
            <button
              type="button"
              onClick={() => runAction('reject')}
              disabled={saving}
              className="rounded bg-yellow-500 px-5 py-2 font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-60"
            >
              Save & Reject
            </button>
            <button
              type="button"
              onClick={() => runAction('publish')}
              disabled={saving}
              className="rounded bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              Save & Publish
            </button>
          </div>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-lg">
          <h2 className="text-lg font-bold text-primary">Publish Options</h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose to publish now or schedule this job. Scheduling queues this job for the automatic
            3-hour cadence.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="text-sm font-medium text-gray-700">
              Schedule publish time
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(event) => setScheduleAt(event.target.value)}
                className="mt-2 w-full rounded border px-3 py-2"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => runAction('schedule')}
                disabled={saving}
                className="rounded bg-secondary px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                Schedule Publish
              </button>
              <button
                type="button"
                onClick={() => runAction('publish_now')}
                disabled={saving}
                className="rounded bg-primary px-5 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                Publish Now (Ignore Schedule)
              </button>
              {publishStatus === 'queued' && (
                <button
                  type="button"
                  onClick={() => runAction('cancel_schedule')}
                  disabled={saving}
                  className="rounded bg-yellow-500 px-5 py-2 font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-60"
                >
                  Cancel Schedule
                </button>
              )}
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
