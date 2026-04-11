'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Job } from '@/lib/jobs';

type JobApiResponse = {
  jobs?: Job[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
};

type DeadlineFilter = 'all' | 'active' | 'expired' | 'none';
type SortOrder = 'newest' | 'oldest';

const AGE_OPTIONS = [
  { label: 'All ages', value: 'all' },
  { label: '5+ days old', value: '5' },
  { label: '10+ days old', value: '10' },
  { label: '15+ days old', value: '15' },
  { label: '20+ days old', value: '20' },
  { label: '30+ days old', value: '30' },
];

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(now: Date, earlier: Date) {
  const diffMs = now.getTime() - earlier.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default function PublishedJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const fetchAllJobs = async () => {
    try {
      setLoading(true);
      setError('');

      const limit = 200;
      let page = 1;
      let allJobs: Job[] = [];
      let pages = 1;

      while (page <= pages) {
        const res = await fetch(`/api/jobs?limit=${limit}&page=${page}`, { cache: 'no-store' });
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }

        const data = (await res.json()) as JobApiResponse;
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch jobs.');
        }

        allJobs = [...allJobs, ...(data.jobs || [])];
        pages = data.pagination?.pages || 1;
        page += 1;
      }

      setJobs(allJobs);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllJobs();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const job of jobs) {
      if (job.category) {
        unique.add(job.category);
      }
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const now = new Date();
    const searchLower = search.trim().toLowerCase();
    const ageThreshold = ageFilter === 'all' ? null : Number(ageFilter);

    const filtered = jobs.filter((job) => {
      const createdAt = parseDate(job.created_at);
      const deadline = parseDate(job.application_deadline);

      if (searchLower) {
        const haystack = `${job.title} ${job.company} ${job.location} ${job.category}`.toLowerCase();
        if (!haystack.includes(searchLower)) {
          return false;
        }
      }

      if (categoryFilter !== 'all' && job.category !== categoryFilter) {
        return false;
      }

      if (ageThreshold !== null && createdAt) {
        const ageDays = daysBetween(now, createdAt);
        if (ageDays < ageThreshold) {
          return false;
        }
      }

      if (deadlineFilter !== 'all') {
        if (!deadline) {
          return deadlineFilter === 'none';
        }

        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const isExpired = deadlineDate < today;
        if (deadlineFilter === 'expired' && !isExpired) {
          return false;
        }
        if (deadlineFilter === 'active' && isExpired) {
          return false;
        }
      }

      return true;
    });

    filtered.sort((a, b) => {
      const aDate = parseDate(a.created_at)?.getTime() || 0;
      const bDate = parseDate(b.created_at)?.getTime() || 0;
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
    });

    return filtered;
  }, [jobs, search, ageFilter, deadlineFilter, categoryFilter, sortOrder]);

  const expiredCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return jobs.filter((job) => {
      const deadline = parseDate(job.application_deadline);
      if (!deadline) {
        return false;
      }
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      return deadlineDate < today;
    }).length;
  }, [jobs]);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected]
  );

  const toggleSelection = (id: string, value: boolean) => {
    setSelected((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const toggleSelectAll = (value: boolean) => {
    const next: Record<string, boolean> = {};
    for (const job of filteredJobs) {
      next[job.id] = value;
    }
    setSelected(next);
  };

  const deleteJob = async (id: string) => {
    const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    if (res.status === 401) {
      router.push('/admin/login');
      return false;
    }
    return res.ok;
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      setMessage('No jobs selected for deletion.');
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} job(s) permanently? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setMessage('');
    setError('');

    let failed = 0;
    for (const id of selectedIds) {
      const ok = await deleteJob(id);
      if (!ok) {
        failed += 1;
      }
    }

    await fetchAllJobs();
    setSelected({});
    if (failed > 0) {
      setError(`${failed} job(s) failed to delete.`);
    } else {
      setMessage('Selected jobs deleted.');
    }
  };

  const handleDeleteExpired = async () => {
    const expiredJobs = jobs.filter((job) => {
      const deadline = parseDate(job.application_deadline);
      if (!deadline) {
        return false;
      }
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadlineDate < today;
    });

    if (expiredJobs.length === 0) {
      setMessage('No expired jobs to delete.');
      return;
    }

    const confirmed = window.confirm(
      `Delete ${expiredJobs.length} expired job(s)? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setMessage('');
    setError('');

    let failed = 0;
    for (const job of expiredJobs) {
      const ok = await deleteJob(job.id);
      if (!ok) {
        failed += 1;
      }
    }

    await fetchAllJobs();
    if (failed > 0) {
      setError(`${failed} expired job(s) failed to delete.`);
    } else {
      setMessage('Expired jobs deleted.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-primary">Published Jobs</h1>
          <p className="mt-2 text-sm text-gray-600">
            Filter by age, deadline status, or category. Select jobs to delete when they become
            stale or expired.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/jobs/new"
            className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Add New Job
          </Link>
          <Link
            href="/admin/jobs"
            className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-slate-50"
          >
            Manage Jobs
          </Link>
        </div>
      </div>

      {error && <div className="rounded bg-red-100 p-4 text-red-700">{error}</div>}
      {message && <div className="rounded bg-green-100 p-4 text-green-700">{message}</div>}

      <section className="rounded-xl bg-white p-6 shadow-lg">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">Total Jobs</p>
            <p className="text-2xl font-bold text-primary">{jobs.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Filtered Results</p>
            <p className="text-2xl font-bold text-primary">{filteredJobs.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expired Deadlines</p>
            <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
          </div>
          <div className="flex items-end justify-start gap-2">
            <button
              onClick={handleDeleteExpired}
              className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Delete Expired
            </button>
            <button
              onClick={handleDeleteSelected}
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Delete Selected
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="text-sm font-medium text-gray-700">
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-2 w-full rounded border px-3 py-2 text-sm"
              placeholder="Title, company, location..."
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Age Filter
            <select
              value={ageFilter}
              onChange={(event) => setAgeFilter(event.target.value)}
              className="mt-2 w-full rounded border px-3 py-2 text-sm"
            >
              {AGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Deadline Status
            <select
              value={deadlineFilter}
              onChange={(event) => setDeadlineFilter(event.target.value as DeadlineFilter)}
              className="mt-2 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="none">No Deadline</option>
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Category
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="mt-2 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Sort
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="mt-2 w-full rounded border px-3 py-2 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-lg">
        {loading ? (
          <p className="py-8 text-center text-gray-600">Loading published jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <p className="py-8 text-center text-gray-600">No jobs match the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="border-b bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filteredJobs.length > 0 && selectedIds.length === filteredJobs.length}
                      onChange={(event) => toggleSelectAll(event.target.checked)}
                    />
                  </th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const createdAt = parseDate(job.created_at);
                  const deadline = parseDate(job.application_deadline);
                  const ageDays = createdAt ? daysBetween(new Date(), createdAt) : null;

                  return (
                    <tr key={job.id} className="border-b">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(selected[job.id])}
                          onChange={(event) => toggleSelection(job.id, event.target.checked)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{job.title}</div>
                        <div className="text-xs text-gray-500">{job.location}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{job.company}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {job.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {ageDays !== null ? `${ageDays} days` : 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {deadline ? deadline.toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/jobs/${job.id}`}
                            className="rounded bg-slate-400 px-3 py-1 text-white transition hover:bg-slate-500"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={async () => {
                              const confirmed = window.confirm(
                                'Delete this job permanently? This cannot be undone.'
                              );
                              if (!confirmed) {
                                return;
                              }
                              const ok = await deleteJob(job.id);
                              if (!ok) {
                                setError('Failed to delete job.');
                                return;
                              }
                              await fetchAllJobs();
                            }}
                            className="rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
