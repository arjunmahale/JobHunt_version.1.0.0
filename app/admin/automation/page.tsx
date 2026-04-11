'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type DashboardResponse = {
  settings: {
    review_required: boolean;
    auto_post_enabled: boolean;
    whatsapp_enabled: boolean;
    telegram_enabled: boolean;
    schedule_cron: string;
    max_jobs_per_run: number;
  };
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    source_name: string;
    review_status: string;
    publish_status: string;
    created_at: string;
    scheduled_publish_at?: string | null;
    apply_link: string;
    failure_reason: string | null;
  }>;
  runs: Array<{
    id: string;
    trigger: string;
    status: string;
    fetched_total: number;
    processed_total: number;
    pending_total: number;
    published_total: number;
    failed_total: number;
    started_at: string;
  }>;
};

const emptyDashboard: DashboardResponse = {
  settings: {
    review_required: true,
    auto_post_enabled: false,
    whatsapp_enabled: false,
    telegram_enabled: false,
    schedule_cron: '0 9 * * *',
    max_jobs_per_run: 25,
  },
  jobs: [],
  runs: [],
};

export default function AutomationPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardResponse>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [publishingScheduled, setPublishingScheduled] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/automation/jobs', { cache: 'no-store' });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load automation dashboard.');
      }

      setDashboard(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load automation dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSettingsChange = (name: string, value: boolean | string | number) => {
    setDashboard((currentDashboard) => ({
      ...currentDashboard,
      settings: {
        ...currentDashboard.settings,
        [name]: value,
      },
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/automation/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dashboard.settings),
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings.');
      }

      setDashboard((currentDashboard) => ({
        ...currentDashboard,
        settings: data.settings,
      }));
      setMessage('Automation settings saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const runPipeline = async (dryRun: boolean) => {
    try {
      setRunning(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/automation/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun,
          trigger: dryRun ? 'admin_dry_run' : 'admin_manual',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run automation.');
      }

      setMessage(
        dryRun
          ? `Dry run complete: fetched ${data.fetched}, processed ${data.processed}, pending ${data.pending}.`
          : `Run complete: fetched ${data.fetched}, processed ${data.processed}, published ${data.published}.`
      );
      await loadDashboard();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Failed to run automation.');
    } finally {
      setRunning(false);
    }
  };

  const updateJobState = async (jobId: string, action: 'approve' | 'reject') => {
    try {
      setError('');
      setMessage('');

      const response = await fetch(`/api/automation/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: action === 'reject' ? JSON.stringify({ reason: 'Rejected by admin reviewer.' }) : undefined,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} job.`);
      }

      setMessage(`Job ${action}d successfully.`);
      await loadDashboard();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : `Failed to ${action} job.`);
    }
  };


  const deleteRejectedJob = async (jobId: string) => {
    const confirmed = window.confirm(
      'Delete this rejected job permanently? This cannot be undone.'
    );
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setMessage('');

      const response = await fetch(`/api/automation/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete rejected job.');
      }

      setMessage('Rejected job deleted.');
      await loadDashboard();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete rejected job.');
    }
  };

  const cancelSchedule = async (jobId: string) => {
    try {
      setError('');
      setMessage('');

      const response = await fetch(`/api/automation/jobs/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_schedule' }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel schedule.');
      }

      setMessage('Scheduled job moved back to pending.');
      await loadDashboard();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel schedule.');
    }
  };

  const runScheduledNow = async () => {
    try {
      setPublishingScheduled(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/automation/publish-scheduled-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5, force_all_queued: true }),
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish scheduled jobs.');
      }

      const published = Number(data.published || 0);
      const failed = Number(data.failed || 0);
      const total = Number(data.total || 0);
      if (total === 0) {
        setMessage('Scheduled publish run complete. No queued jobs were available.');
      } else {
        setMessage(
          `Scheduled publish run complete. Attempted ${total} job(s): ${published} published, ${failed} failed.`
        );
      }
      await loadDashboard();
    } catch (publishError) {
      setError(
        publishError instanceof Error ? publishError.message : 'Failed to publish scheduled jobs.'
      );
    } finally {
      setPublishingScheduled(false);
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-gray-600">Loading automation dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-primary">Automation Pipeline</h1>
        <p className="mt-2 text-gray-600">
          Review pending jobs, control auto-posting, and trigger the full ingestion pipeline.
        </p>
        <div className="mt-4">
          <Link
            href="/admin/manual-jobs"
            className="inline-flex rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-slate-50"
          >
            Open Manual Job Upload
          </Link>
        </div>
      </div>

      {error && <div className="rounded bg-red-100 p-4 text-red-700">{error}</div>}
      {message && <div className="rounded bg-green-100 p-4 text-green-700">{message}</div>}

      <section className="rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">Automation Settings</h2>
            <p className="text-sm text-gray-500">
              These settings control review requirements, auto-posting, and daily scheduler behavior.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => runPipeline(true)}
              disabled={running}
              className="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition hover:bg-gray-300 disabled:opacity-50"
            >
              {running ? 'Running...' : 'Dry Run'}
            </button>
            <button
              onClick={() => runPipeline(false)}
              disabled={running}
              className="rounded bg-secondary px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {running ? 'Running...' : 'Run Now'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between rounded border p-4">
            <span className="font-medium text-gray-700">Review required before publish</span>
            <input
              type="checkbox"
              checked={dashboard.settings.review_required}
              onChange={(event) => handleSettingsChange('review_required', event.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between rounded border p-4">
            <span className="font-medium text-gray-700">Auto-post after approval</span>
            <input
              type="checkbox"
              checked={dashboard.settings.auto_post_enabled}
              onChange={(event) => handleSettingsChange('auto_post_enabled', event.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between rounded border p-4">
            <span className="font-medium text-gray-700">WhatsApp posting enabled</span>
            <input
              type="checkbox"
              checked={dashboard.settings.whatsapp_enabled}
              onChange={(event) => handleSettingsChange('whatsapp_enabled', event.target.checked)}
            />
          </label>

          <label className="flex items-center justify-between rounded border p-4">
            <span className="font-medium text-gray-700">Telegram posting enabled</span>
            <input
              type="checkbox"
              checked={dashboard.settings.telegram_enabled}
              onChange={(event) => handleSettingsChange('telegram_enabled', event.target.checked)}
            />
          </label>

          <label className="rounded border p-4">
            <span className="mb-2 block font-medium text-gray-700">Cron schedule</span>
            <input
              type="text"
              value={dashboard.settings.schedule_cron}
              onChange={(event) => handleSettingsChange('schedule_cron', event.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="0 9 * * *"
            />
          </label>

          <label className="rounded border p-4">
            <span className="mb-2 block font-medium text-gray-700">Max jobs per run</span>
            <input
              type="number"
              value={dashboard.settings.max_jobs_per_run}
              onChange={(event) =>
                handleSettingsChange('max_jobs_per_run', Number(event.target.value || 0))
              }
              className="w-full rounded border px-3 py-2"
              min={1}
            />
          </label>
        </div>

        <div className="mt-6">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="rounded bg-primary px-5 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </section>


      <section className="rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-primary">Pending & Approved (Unschedule) Jobs</h2>

        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-sm">
            <thead className="border-b bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Publish</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.jobs
                .filter(
                  (job) =>
                    (job.review_status === 'pending' || job.review_status === 'approved') &&
                    job.publish_status !== 'queued' &&
                    job.publish_status !== 'published'
                )
                .map((job) => (
                <tr key={job.id} className="border-b align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{job.title}</div>
                    <a
                      href={job.apply_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Open apply link
                    </a>
                    {job.failure_reason && (
                      <div className="mt-2 text-xs text-red-600">{job.failure_reason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{job.company}</td>
                  <td className="px-4 py-3 text-gray-700">{job.source_name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                      {job.review_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                      {job.publish_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(job.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/automation/jobs/${job.id}`}
                        className="rounded border border-primary px-3 py-1 text-primary transition hover:bg-slate-50"
                      >
                        View/Edit
                      </Link>
                      {job.review_status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateJobState(job.id, 'approve')}
                            className="rounded bg-green-600 px-3 py-1 text-white transition hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateJobState(job.id, 'reject')}
                            className="rounded bg-yellow-500 px-3 py-1 text-white transition hover:bg-yellow-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {job.review_status !== 'published' && job.review_status !== 'rejected' && (
                        <Link
                          href={`/admin/automation/jobs/${job.id}`}
                          className="rounded bg-primary px-3 py-1 text-white transition hover:bg-slate-700"
                        >
                          Publish
                        </Link>
                      )}
                      {job.review_status === 'rejected' && (
                        <button
                          onClick={() => deleteRejectedJob(job.id)}
                          className="rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-primary">Scheduled Publish Queue</h2>
          <button
            onClick={runScheduledNow}
            disabled={publishingScheduled}
            className="rounded bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {publishingScheduled ? 'Publishing...' : 'Run Scheduled Now'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-sm">
            <thead className="border-b bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Scheduled At (Local)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.jobs
                .filter((job) => job.publish_status === 'queued')
                .map((job) => (
                  <tr key={job.id} className="border-b">
                    <td className="px-4 py-3 font-semibold text-gray-900">{job.title}</td>
                    <td className="px-4 py-3 text-gray-700">{job.company}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {job.scheduled_publish_at
                        ? new Date(job.scheduled_publish_at).toLocaleString()
                        : 'Not scheduled'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                        {job.publish_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/automation/jobs/${job.id}`}
                        className="rounded border border-primary px-3 py-1 text-primary transition hover:bg-slate-50"
                      >
                        View/Edit
                      </Link>
                      <button
                        onClick={() => cancelSchedule(job.id)}
                        className="rounded bg-yellow-500 px-3 py-1 text-white transition hover:bg-yellow-600"
                      >
                        Cancel Schedule
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-primary">Recent Runs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="border-b bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Fetched</th>
                <th className="px-4 py-3">Processed</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Failed</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.runs.map((run) => (
                <tr key={run.id} className="border-b">
                  <td className="px-4 py-3 text-gray-700">{new Date(run.started_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{run.trigger}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{run.status}</td>
                  <td className="px-4 py-3 text-gray-700">{run.fetched_total}</td>
                  <td className="px-4 py-3 text-gray-700">{run.processed_total}</td>
                  <td className="px-4 py-3 text-gray-700">{run.pending_total}</td>
                  <td className="px-4 py-3 text-gray-700">{run.published_total}</td>
                  <td className="px-4 py-3 text-gray-700">{run.failed_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
