'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { JobCard } from '@/components/JobCard';
import { Pagination } from '@/components/Pagination';
import { JobCardSkeleton } from '@/components/LoadingSkeletons';
import { AdSense } from '@/components/AdSense';
import { Job } from '@/lib/jobs';

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const page = parseInt(searchParams.get('page') || '1');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    limit: 20,
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const category = slug.replace(/-/g, ' ');
        const res = await fetch(`/api/jobs?category=${encodeURIComponent(category)}&page=${page}`);
        const data = await res.json();

        setJobs(data.jobs);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Failed to fetch category jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [slug, page]);

  const categoryName = slug.replace(/-/g, ' ').charAt(0).toUpperCase() + 
                      slug.replace(/-/g, ' ').slice(1);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          {categoryName} Jobs
        </h1>
        <p className="text-gray-600">
          Found {pagination.total} job{pagination.total !== 1 ? 's' : ''}
        </p>
      </div>

      <AdSense slot="6789012345" format="horizontal" />

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
            currentPage={pagination.page}
            totalPages={pagination.pages}
            baseUrl={`/category/${slug}`}
          />
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600 text-lg">No jobs in this category</p>
        </div>
      )}
    </>
  );
}