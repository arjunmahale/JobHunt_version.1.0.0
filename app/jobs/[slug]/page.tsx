import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getJobBySlug, getJobsByCategory } from '@/lib/jobs';
import { generateMetaTags, generateStructuredData } from '@/lib/seo';

// export const metadata = {
//   robots: {
//     index: true,
//     follow: true,
//   },
// };

export const dynamic = "force-dynamic";
export const revalidate = 0;
interface PageProps {
params: {
slug: string;
};
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
const job = await getJobBySlug(params.slug);

if (!job) {
return { title: 'Job Not Found' };
}
// console.log("JOB OBJECT:", job);
// console.log("HOW_TO_APPLY FIELD:", job?.how_to_apply);
// 


const seo = generateMetaTags({
title: `${job.title} at ${job.company} | JobHunt`,
description: job.description.substring(0, 160),
url: `${process.env.NEXT_PUBLIC_APP_URL}/jobs/${job.slug}`,
});

return {
title: seo.title,
description: seo.description,
openGraph: seo.openGraph as any,
twitter: seo.twitter as any,

 robots: {
      index: true,
      follow: true,
    },
};
}

export default async function JobPage({ params }: PageProps) {
const job = await getJobBySlug(params.slug);
// console.log("JOB OBJECT:", job);
// console.log("HOW_TO_APPLY FIELD:", job?.number_of_openings);
if (!job) {
notFound();
}
const similarJobs = await getJobsByCategory(job.category, 6);
const relatedJobs = similarJobs.jobs.filter(j => j.slug !== job.slug);
const structuredData = generateStructuredData(job);

const formatBulletPoints = (text: string) => {
if (!text) return [];
return text.split('\n').filter((line) => line.trim().length > 0);
};

return (
<>
<script
type="application/ld+json"
dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
/>


  <div className="w-full max-w-3xl sm:max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">

    <Link
      href="/jobs"
      className="text-sm text-gray-600 hover:text-blue-600 mb-4 sm:mb-6 inline-flex items-center gap-2 font-semibold"
    >
      ← Back to All Jobs
    </Link>

    {/* Header */}
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-4 sm:mb-8">
      <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
        {job.title}
      </h1>

      <p className="text-base sm:text-xl text-gray-700 font-semibold mb-1 sm:mb-2">
        {job.company}
      </p>

      <p className="text-gray-500 text-xs sm:text-sm">
        Posted on{' '}
        {new Date(job.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>

    {/* Job Info */}
<div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-4 sm:mb-8">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

    {job.location && (
      <div>
        <p className="text-xs text-gray-500 mb-1">Location</p>
        <p className="font-semibold text-gray-900">{job.location}</p>
      </div>
    )}

    {job.salary && (
      <div>
        <p className="text-xs text-gray-500 mb-1">Salary</p>
        <p className="font-semibold text-gray-900">{job.salary}</p>
      </div>
    )}

    {job.job_type && (
      <div>
        <p className="text-xs text-gray-500 mb-1">Job Type</p>
        <p className="font-semibold text-gray-900">{job.job_type}</p>
      </div>
    )}

    {job.experience_level && (
      <div>
        <p className="text-xs text-gray-500 mb-1">Experience</p>
        <p className="font-semibold text-gray-900">{job.experience_level}</p>
      </div>
    )}

    {/* NEW FIELD */}
    {job.application_deadline && (
      <div>
        <p className="text-xs text-gray-500 mb-1">Application Deadline</p>
        <p className="font-semibold text-gray-900">
          {new Date(job.application_deadline).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    )}

    {/* NEW FIELD */}
    {job.work_mode && (
      <div>
        <p className="text-xs text-gray-500 mb-1">Work Mode</p>
        <p className="font-semibold text-gray-900">{job.work_mode}</p>
      </div>
    )}

    {/* NEW FIELD */}
    {job.number_of_openings && (
      <div>
        <p className="text-xs text-gray-500 mb-1">Openings</p>
        <p className="font-semibold text-gray-900">{job.number_of_openings}</p>
      </div>
    )}

  </div>
</div>


{/* About Company */}
{job.about_company && (
  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-4 sm:mb-8">
    <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">
      About Company
    </h2>

    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
      {job.about_company}
    </div>
  </div>
)}
    {/* Description */}
    {job.description && (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">
          Job Description
        </h2>

        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
          {job.description}
        </div>
      </div>
    )}

    {/* Apply CTA */}
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-4 sm:mb-8 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start sm:items-center">
      <div>
        <h3 className="text-lg sm:text-2xl font-bold mb-1">
          Ready to Apply?
        </h3>
        <p className="text-gray-600 text-sm sm:text-base">
          Submit your application and start your career with {job.company}
        </p>
      </div>

      <a
        href={job.apply_link}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 sm:px-6 sm:py-3 rounded-lg transition text-sm sm:text-base"
      >
        Apply Now →
      </a>
    </div>

{/* Eligibility Criteria */}
{job.eligibility_criteria && (
  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-4 sm:mb-8">
    
    <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">
      Eligibility Criteria
    </h2>

    <ul className="space-y-3 sm:space-y-4">
      {formatBulletPoints(job.eligibility_criteria).map((point, index) => (
        <li key={index} className="flex items-start gap-3 text-sm sm:text-base text-gray-700">
          
          {/* Circular Blue Check */}
          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-500 rounded-full text-white text-xs font-bold bg-blue-500">
            ✓
          </span>

          <span>
            {point.trim().replace(/^[•\-\*]\s*/, '')}
          </span>

        </li>
      ))}
    </ul>

  </div>
)}

    {/* Roles */}
    {job.roles_responsibilities && (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">
          Roles & Responsibilities
        </h2>

        <div className="space-y-3 sm:space-y-4">
          {formatBulletPoints(job.roles_responsibilities).map((point, index) => (
            <div key={index} className="flex gap-3">
              <div className="font-bold text-blue-600 text-sm sm:text-base">
                {index + 1}.
              </div>
              <p className="text-gray-700 text-sm sm:text-base">
                {point.trim().replace(/^[•\-\*]\s*/, '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Skills */}
    {job.required_skills && (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">
          Required Skills
        </h2>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {formatBulletPoints(job.required_skills).map((skill, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-700 px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold"
            >
              {skill.trim().replace(/^[•\-\*]\s*/, '')}
            </span>
          ))}
        </div>
      </div>
    )}
{/* How to Apply */}
{job?.how_to_apply && (
  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-4 sm:mb-8">
    
    <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">
      How to Apply
    </h2>

    <ul className="space-y-3 sm:space-y-4">
      {formatBulletPoints(job.how_to_apply).map((point, index) => (
        <li key={index} className="flex items-start gap-3 text-sm sm:text-base text-gray-700">
          
          {/* Number Circle */}
          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-500 rounded-full text-white text-xs font-bold bg-blue-500">
            {index + 1}
          </span>

          <span>
            {point.trim().replace(/^[•\-\*]\s*/, '')}
          </span>

        </li>
      ))}
      
    </ul>

  </div>
)}

{/* Similar Jobs */}
{relatedJobs.length > 0 && (
  <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl p-4 sm:p-8 mb-8">
    
    <h2 className="text-lg sm:text-2xl font-bold mb-6">
      More {job.category} Jobs
    </h2>

    <div className="grid gap-4 sm:grid-cols-2">
      {relatedJobs.map((related) => (
        <Link
          key={related.id}
          href={`/jobs/${related.slug}`}
          className="block border rounded-lg p-4 hover:shadow-md transition"
        >
          <h3 className="font-semibold text-gray-900 mb-1">
            {related.title}
          </h3>

          <p className="text-sm text-gray-600 mb-2">
            {related.company}
          </p>

          <p className="text-xs text-gray-500">
            {related.location}
          </p>
        </Link>
      ))}
    </div>
  </div>
)}

  </div>
</>


);
}
