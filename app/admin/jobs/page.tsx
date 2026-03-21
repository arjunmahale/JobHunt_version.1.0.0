'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Job } from '@/lib/jobs';

export default function ManageJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs?limit=100');


        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch jobs');
        }

        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();


  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;


    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (res.ok) {
        setJobs(jobs.filter((job) => job.id !== id));
      } else {
        alert('Failed to delete job');
      }
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Error deleting job');
    }


  };

  if (error) {
    return (<div className="bg-red-100 text-red-700 p-4 rounded">
      {error} </div>
    );
  }

  return (<div className="w-full">


    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-4xl font-bold text-primary">
        Manage Jobs
      </h1>

      <Link
        href="/admin/jobs/new"
        className="bg-secondary hover:bg-blue-600 text-white font-bold py-2 px-5 sm:px-6 rounded-lg transition w-fit"
      >
        + Add New Job
      </Link>
    </div>

    {loading ? (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading jobs...</p>
      </div>
    ) : jobs.length > 0 ? (

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">

        {/* Scroll container for mobile */}
        <div className="overflow-x-auto">

          <table className="min-w-[700px] w-full">

            <thead className="bg-indigo-100 text-black text-sm sm:text-base border-b border-gray-400">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left border-l ">Title</th>
                <th className="px-4 sm:px-6 py-3 text-left ">Company</th>
                <th className="px-4 sm:px-6 py-3 text-left ">Location</th>
                <th className="px-4 sm:px-6 py-3 text-left ">Category</th>
                <th className="px-4 sm:px-6 py-3 text-left ">Created</th>
                <th className="px-4 sm:px-6 py-3 text-left ">Deadline</th>
                <th className="px-4 sm:px-6 py-3 text-left ">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-300 text-sm sm:text-base">

              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">

                  <td className="px-4 sm:px-6 py-3 font-semibold text-gray-900 ">
                    {job.title}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-gray-700 ">
                    {job.company}
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-gray-700 ">
                    {job.location}
                  </td>

                  <td className="px-4 sm:px-6 py-3 ">
                    <span className="bg-blue-100 text-secondary px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                      {job.category}
                    </span>
                  </td>

                  <td className="px-4 sm:px-6 py-3 text-gray-700 ">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td
                    className={`px-4 sm:px-6 py-3 ${(() => {
                        if (!job.application_deadline) return "text-gray-700"; // ✅ FIX

                        const deadline = new Date(job.application_deadline);
                        const today = new Date();

                        deadline.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);

                        return deadline < today
                          ? "bg-red-200 text-red-800 font-semibold"
                          : "text-gray-700";
                      })()
                      }`}
                  >
                    {job.application_deadline
                      ? new Date(job.application_deadline).toLocaleDateString('en-GB')
                      : "N/A"}
                  </td>
                  <td className="px-4 sm:px-6 py-3 flex gap-3 ">


                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="text-white hover:text-blue-600 font-semibold bg-slate-400 eclipse px-2 py-1 rounded"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-white hover:text-red-800 font-semibold bg-red-600 hover:bg-red-600 py-1 px-2 rounded"
                    >
                      Delete
                    </button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    ) : (
      <div className="bg-white rounded-lg p-6 sm:p-8 text-center">
        <p className="text-gray-600 mb-4">No jobs found</p>

        <Link
          href="/admin/jobs/new"
          className="text-secondary hover:text-blue-600 font-semibold"
        >
          Create your first job →
        </Link>
      </div>
    )}

  </div>


  );
}
