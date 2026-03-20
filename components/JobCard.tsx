import Link from 'next/link';
import { Job } from '@/lib/jobs';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.slug}`} className="group block">

      <div className="relative">

        {/* Dummy card behind */}
        <div
          className="
          absolute
          top-1 -left-1
          w-full h-full
          rounded-xl
          bg-blue-400/40
          transition-transform duration-500 ease-out
          // group-hover:rotate-[2deg]
          group-hover:translate-y-2
          z-0 
          group-hover:-translate-x-2
         
          "
        ></div>

        {/* Main card */}
        <div
          className="
          relative z-10
          bg-white
          rounded-xl
          shadow-md
          hover:shadow-2xl
          transition-all duration-300
          p-6
          border border-gray-200
          hover:-translate-y-1,
           
           
          "
        >

          {/* Title + Category */}
          <div className="flex items-start gap-3 mb-3">

            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary group-hover:text-blue-600 transition line-clamp-2">
                {job.title}
              </h3>

              <p className="text-gray-600 text-sm">{job.company}</p>
            </div>

            <span className="bg-secondary text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
              {job.category}
            </span>

          </div>

          {/* Location + Salary */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">

            <span className="flex items-center gap-1">
              📍 {job.location}
            </span>

            <span className="flex items-center gap-1">
              💰 {job.salary}
            </span>

          </div>

          {/* Description */}
          {job.description && (
            <p className="text-gray-700 text-sm line-clamp-2 mb-4">
              {job.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">

            <span className="text-xs text-gray-500">
              Posted {new Date(job.created_at).toLocaleDateString()}
            </span>

            <span className="text-secondary font-semibold text-sm flex items-center gap-1">
              View Details →
            </span>

          </div>

        </div>

      </div>

    </Link>
  );
}