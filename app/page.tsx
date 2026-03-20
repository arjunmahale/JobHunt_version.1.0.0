'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { JobCard } from '@/components/JobCard';
import { JobCardSkeleton } from '@/components/LoadingSkeletons';
import dynamic from 'next/dynamic';

const AdSense = dynamic(() => import('@/components/AdSense').then(m => m.AdSense), {
  ssr: false,
});
import { Job } from '@/lib/jobs';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const jobsRes = await fetch('/api/jobs?limit=6');
      const jobsData: { jobs: Job[] } = await jobsRes.json();
      setJobs(jobsData.jobs);

      const categoriesRes = await fetch('/api/categories');
      const categoriesData: { categories: string[] } = await categoriesRes.json();
      setCategories(categoriesData.categories);

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkScreen = () => {
    setIsMobile(window.innerWidth < 640); // Tailwind mobile breakpoint
  };

  checkScreen();
  window.addEventListener("resize", checkScreen);

  return () => window.removeEventListener("resize", checkScreen);
}, []);
const sectionStyle = isMobile
  ? {}
  : {
      backgroundImage: "url('/job_bg.jpg')",
      backgroundSize: "70%",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment: "fixed"
    };
  return (
    <>
      {/* Hero Section */}
      <section
  className="text-white rounded-lg py-20 px-6 mb-12 bg-cover bg-center relative overflow-hidden"
  style={sectionStyle}
>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-0"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-black font-serif" >
            Find Your Dream Job
          </h1>
          
          <p className="text-lg md:text-xl text-black-100 mb-8 text-black">
            Discover thousands of job opportunities with all the information you need
          </p>
          <Link
            href="/jobs"
            className="inline-block bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-blue-400 transition"
          >
            Browse All Jobs
          </Link>
        </div>
      </section>

      {/* AdSense Homepage Ad */}
      <AdSense slot="1234567890" format="horizontal" />

      {/* Featured Categories */}
      <section className="mb-12" >
        <h2 className="text-3xl font-bold text-primary mb-6">Browse by Category</h2>
        <div  className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(categories || []).slice(0, 8).map((cat) => (
            <Link
              key={cat}
              href={`/category/${cat.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition text-center"
            >
              <h3  className="font-semibold text-primary">{cat}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Jobs */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-primary">Latest Jobs</h2>
          <Link
            href="/jobs"
            className="text-secondary hover:text-blue-600 font-semibold"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg" >No jobs found</p>
          </div>
        )}
      </section>

      {/* AdSense Bottom Ad */}
      <AdSense slot="2345678901" format="rectangle" />
    </>
  );
}