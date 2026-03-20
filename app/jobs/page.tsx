'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { JobCard } from '@/components/JobCard';
import { Pagination } from '@/components/Pagination';
import { JobCardSkeleton } from '@/components/LoadingSkeletons';
import { AdSense } from '@/components/AdSense';
import { Job } from '@/lib/jobs';

function JobsContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    limit: 20,
  });

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search');
  const category = searchParams.get('category');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        let url = `/api/jobs?page=${page}`;

        if (search) {
          url = `/api/search?q=${encodeURIComponent(search)}&page=${page}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        setJobs(data.jobs);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [page, search, category]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          {search ? `Search Results for "${search}"` : 'All Jobs'}
        </h1>
        <p className="text-gray-600">
          Found {pagination.total} job{pagination.total !== 1 ? 's' : ''}
        </p>
      </div>

      <AdSense slot="3456789012" format="horizontal" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={pagination.pages}
            baseUrl="/jobs"
            query={search ? { search } : {}}
          />
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600 text-lg">No jobs found</p>
        </div>
      )}
    </>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobsContent />
    </Suspense>
  );
}