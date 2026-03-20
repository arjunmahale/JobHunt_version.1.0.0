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

        // If unauthorized, redirect to login
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
      <div className="bg-red-100 text-red-700 p-4 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-8">Admin Dashboard</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Jobs</h3>
              <p className="text-4xl font-bold text-secondary">{stats.total}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">Categories</h3>
              <p className="text-4xl font-bold text-secondary">{stats.categories}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">Status</h3>
              <p className="text-4xl font-bold text-accent">Active</p>
            </div>
          </div>

          <div className="bg-gray-00 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/jobs/new"
                className="bg-indigo-300 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center transition"
              >
                + Add New Job
              </Link>
              <Link
                href="/admin/jobs"
                className="bg-indigo-300 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
              >
                Manage Jobs
              </Link>

   <Link
                href="/admin/messages"
                className="bg-indigo-300 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-center transition"
              >
                Manage Messages
              </Link>

              {/* <Link
  href="/admin/messages"
  className="text-gray-600 hover:text-blue-600"
>
  Messages
</Link> */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}