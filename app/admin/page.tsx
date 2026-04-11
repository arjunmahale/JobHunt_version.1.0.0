'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, categories: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [jobsRes, catRes] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/categories'),
        ]);

        if (jobsRes.status === 401 || catRes.status === 401) {
          router.push('/admin/login');
          return;
        }

        const jobsData = await jobsRes.json();
        const catData = await catRes.json();

        setStats({
          total: jobsData.pagination?.total || 0,
          categories: catData.categories?.length || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (error) {
    return (
      <div className="rounded bg-red-100 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-4xl font-bold text-primary">Admin Dashboard</h1>

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-sm font-semibold text-gray-600">Total Jobs</h3>
              <p className="text-4xl font-bold text-secondary">{stats.total}</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-sm font-semibold text-gray-600">Categories</h3>
              <p className="text-4xl font-bold text-secondary">{stats.categories}</p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-sm font-semibold text-gray-600">Automation</h3>
              <p className="text-2xl font-bold text-accent">Ready</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-primary">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Link
                href="/admin/jobs/new"
                className="rounded-lg bg-indigo-300 px-6 py-3 text-center font-bold text-white transition hover:bg-blue-600"
              >
                + Add New Job
              </Link>
              <Link
                href="/admin/jobs"
                className="rounded-lg bg-indigo-300 px-6 py-3 text-center font-bold text-white transition hover:bg-gray-700"
              >
                Manage Jobs
              </Link>
              <Link
                href="/admin/published-jobs"
                className="rounded-lg bg-indigo-300 px-6 py-3 text-center font-bold text-white transition hover:bg-gray-700"
              >
                Published Jobs
              </Link>
              <Link
                href="/admin/automation"
                className="rounded-lg bg-indigo-300 px-6 py-3 text-center font-bold text-white transition hover:bg-blue-700"
              >
                Automation Review
              </Link>
              <Link
                href="/admin/manual-jobs"
                className="rounded-lg bg-indigo-300 px-6 py-3 text-center font-bold text-white transition hover:bg-blue-700"
              >
                Manual Upload
              </Link>
              <Link
                href="/admin/messages"
                className="rounded-lg bg-indigo-300 px-6 py-3 text-center font-bold text-white transition hover:bg-gray-700"
              >
                Manage Messages
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
